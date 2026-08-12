<?php
/**
 * Plugin Name: Villa Coco Reservations
 * Description: Gestiona reservas por villa y expone su disponibilidad al frontend headless.
 * Version: 1.0.0
 * Author: Villa Coco
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Villa_Coco_Reservations {
    private const POST_TYPE = 'reservation';
    private const REST_NAMESPACE = 'villa-coco/v1';

    public function __construct() {
        add_action('init', array($this, 'register_post_type'));
        add_action('add_meta_boxes', array($this, 'add_reservation_meta_box'));
        add_action('save_post_' . self::POST_TYPE, array($this, 'save_reservation_meta'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    public function register_post_type(): void {
        register_post_type(self::POST_TYPE, array(
            'labels' => array(
                'name' => 'Reservas',
                'singular_name' => 'Reserva',
                'add_new_item' => 'Agregar reserva',
                'edit_item' => 'Editar reserva',
                'menu_name' => 'Reservas',
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'show_in_rest' => true,
            'rest_base' => 'reservations',
            'supports' => array('title'),
            'menu_icon' => 'dashicons-calendar-alt',
        ));

        foreach (array(
            'villa_id' => 'integer',
            'check_in' => 'string',
            'check_out' => 'string',
            'guest_count' => 'integer',
            'guest_name' => 'string',
            'guest_email' => 'string',
            'guest_phone' => 'string',
            'referral_source' => 'string',
            'travel_plans' => 'string',
            'flexible_dates' => 'boolean',
        ) as $key => $type) {
            register_post_meta(self::POST_TYPE, $key, array(
                'single' => true,
                'type' => $type,
                'show_in_rest' => true,
                'sanitize_callback' => $type === 'integer' ? 'absint' : 'sanitize_text_field',
                'auth_callback' => static function (): bool {
                    return current_user_can('edit_posts');
                },
            ));
        }
    }

    public function add_reservation_meta_box(): void {
        add_meta_box(
            'villa-coco-reservation-details',
            'Detalles de la reserva',
            array($this, 'render_reservation_meta_box'),
            self::POST_TYPE,
            'normal',
            'high'
        );
    }

    public function render_reservation_meta_box(WP_Post $post): void {
        wp_nonce_field('villa_coco_reservation', 'villa_coco_reservation_nonce');
        $villa_id = (int) get_post_meta($post->ID, 'villa_id', true);
        $villas = get_posts(array('post_type' => 'villa', 'posts_per_page' => -1, 'post_status' => 'publish', 'orderby' => 'title', 'order' => 'ASC'));
        ?>
        <style>.villa-coco-field{display:grid;grid-template-columns:170px 1fr;gap:12px;align-items:center;margin:14px 0}.villa-coco-field input,.villa-coco-field select{width:100%;max-width:420px}</style>
        <div class="villa-coco-field"><label for="villa_id"><strong>Villa relacionada</strong></label><select id="villa_id" name="villa_id" required><option value="">Selecciona una villa</option><?php foreach ($villas as $villa) : ?><option value="<?php echo esc_attr($villa->ID); ?>" <?php selected($villa_id, $villa->ID); ?>><?php echo esc_html($villa->post_title); ?></option><?php endforeach; ?></select></div>
        <div class="villa-coco-field"><label for="check_in"><strong>Fecha de entrada</strong></label><input id="check_in" name="check_in" type="date" value="<?php echo esc_attr(get_post_meta($post->ID, 'check_in', true)); ?>" required></div>
        <div class="villa-coco-field"><label for="check_out"><strong>Fecha de salida</strong></label><input id="check_out" name="check_out" type="date" value="<?php echo esc_attr(get_post_meta($post->ID, 'check_out', true)); ?>" required></div>
        <div class="villa-coco-field"><label for="guest_count"><strong>Cantidad de invitados</strong></label><input id="guest_count" name="guest_count" type="number" min="1" value="<?php echo esc_attr(get_post_meta($post->ID, 'guest_count', true)); ?>" required></div>
        <div class="villa-coco-field"><label for="guest_name"><strong>Nombre de quien reserva</strong></label><input id="guest_name" name="guest_name" type="text" value="<?php echo esc_attr(get_post_meta($post->ID, 'guest_name', true)); ?>" required></div>
        <div class="villa-coco-field"><label for="guest_email"><strong>Correo electrónico</strong></label><input id="guest_email" name="guest_email" type="email" value="<?php echo esc_attr(get_post_meta($post->ID, 'guest_email', true)); ?>"></div>
        <p class="description">Publica la reserva solo cuando esté confirmada. Las reservas en borrador o pendientes no bloquean el calendario público.</p>
        <?php
    }

    public function save_reservation_meta(int $post_id): void {
        if (!isset($_POST['villa_coco_reservation_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['villa_coco_reservation_nonce'])), 'villa_coco_reservation') || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || !current_user_can('edit_post', $post_id)) {
            return;
        }

        $check_in = isset($_POST['check_in']) ? sanitize_text_field(wp_unslash($_POST['check_in'])) : '';
        $check_out = isset($_POST['check_out']) ? sanitize_text_field(wp_unslash($_POST['check_out'])) : '';
        foreach (array('villa_id', 'guest_count', 'guest_name', 'guest_email') as $field) {
            if (isset($_POST[$field])) {
                $value = in_array($field, array('guest_name', 'guest_email'), true) ? sanitize_text_field(wp_unslash($_POST[$field])) : absint($_POST[$field]);
                update_post_meta($post_id, $field, $value);
            }
        }
        update_post_meta($post_id, 'check_in', $check_in);
        update_post_meta($post_id, 'check_out', $check_out);

        if ($check_in && $check_out && $check_out <= $check_in) {
            add_filter('redirect_post_location', static function ($location) { return add_query_arg('villa_coco_date_error', '1', $location); });
        }
    }

    public function register_rest_routes(): void {
        register_rest_route(self::REST_NAMESPACE, '/villas/(?P<villa_id>\d+)/reservations', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_villa_reservations'),
            'permission_callback' => '__return_true',
            'args' => array('villa_id' => array('validate_callback' => static function ($value): bool { return is_numeric($value); })),
        ));
        register_rest_route(self::REST_NAMESPACE, '/reservation-requests', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'create_reservation_request'),
            'permission_callback' => '__return_true',
        ));
    }

    public function get_villa_reservations(WP_REST_Request $request) {
        $data = array();
        $villa_id = absint($request->get_param('villa_id'));
        $query = new WP_Query(array(
            'post_type' => self::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_query' => array(array('key' => 'villa_id', 'value' => $villa_id, 'compare' => '=')),
        ));
        foreach ($query->posts as $reservation) {
            $check_in = get_post_meta($reservation->ID, 'check_in', true);
            $check_out = get_post_meta($reservation->ID, 'check_out', true);
            if ($check_in && $check_out && $check_out > $check_in) {
                $data[] = array('id' => $reservation->ID, 'check_in' => $check_in, 'check_out' => $check_out);
            }
        }
        usort($data, static function ($a, $b) { return strcmp($a['check_in'], $b['check_in']); });
        return new WP_REST_Response($data, 200);
    }

    public function create_reservation_request(WP_REST_Request $request) {
        $villa_id = absint($request->get_param('villaId'));
        $check_in = sanitize_text_field($request->get_param('checkIn'));
        $check_out = sanitize_text_field($request->get_param('checkOut'));
        $guests = absint($request->get_param('guests'));
        $first_name = sanitize_text_field($request->get_param('firstName'));
        $last_name = sanitize_text_field($request->get_param('lastName'));
        $guest_name = trim($first_name . ' ' . $last_name);
        $guest_email = sanitize_email($request->get_param('email'));
        $guest_phone = sanitize_text_field($request->get_param('phone'));
        $referral_source = sanitize_text_field($request->get_param('referralSource'));
        $travel_plans = sanitize_textarea_field($request->get_param('travelPlans'));
        $flexible_dates = (bool) $request->get_param('flexibleDates');

        if (!$villa_id || get_post_type($villa_id) !== 'villa' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $check_in) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $check_out) || $check_out <= $check_in || !$guests || !$guest_name || !is_email($guest_email) || !$guest_phone || !$referral_source) {
            return new WP_Error('invalid_reservation_request', 'Los datos de la solicitud no son válidos.', array('status' => 400));
        }

        $confirmed = get_posts(array(
            'post_type' => self::POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_query' => array(array('key' => 'villa_id', 'value' => $villa_id, 'compare' => '=')),
        ));
        foreach ($confirmed as $reservation) {
            $reserved_start = get_post_meta($reservation->ID, 'check_in', true);
            $reserved_end = get_post_meta($reservation->ID, 'check_out', true);
            if ($reserved_start < $check_out && $reserved_end > $check_in) {
                return new WP_Error('dates_unavailable', 'Una o más fechas ya no están disponibles.', array('status' => 409));
            }
        }

        $post_id = wp_insert_post(array(
            'post_type' => self::POST_TYPE,
            'post_status' => 'pending',
            'post_title' => sprintf('%s · %s al %s', $guest_name, $check_in, $check_out),
        ), true);
        if (is_wp_error($post_id)) return $post_id;

        update_post_meta($post_id, 'villa_id', $villa_id);
        update_post_meta($post_id, 'check_in', $check_in);
        update_post_meta($post_id, 'check_out', $check_out);
        update_post_meta($post_id, 'guest_count', $guests);
        update_post_meta($post_id, 'guest_name', $guest_name);
        update_post_meta($post_id, 'guest_email', $guest_email);
        update_post_meta($post_id, 'guest_phone', $guest_phone);
        update_post_meta($post_id, 'referral_source', $referral_source);
        update_post_meta($post_id, 'travel_plans', $travel_plans);
        update_post_meta($post_id, 'flexible_dates', $flexible_dates);
        return new WP_REST_Response(array('id' => $post_id), 201);
    }
}

new Villa_Coco_Reservations();
