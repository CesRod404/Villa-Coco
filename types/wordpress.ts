export interface ACFFields {
    descripcion_corta: string;
    fecha_de_inicio: string;
    fecha_final: string;
    habitaciones: number;
    capacidad_de_personas: number;
    precio: string;
    ubicacion: string;
    imagen: string;
    amenidades: string[];
    retreat: string;
    accommodations: string;
    sustenance: string;
    travel: string;
    activities: string;
    non_inclusives: string;
    disponible: boolean;
    fechas_ocupadas: string;
    "check-in": string;
    "check-out": string;
    google_maps: string;
}

export interface Villa {
    id: number;
    slug: string;
    title: {
        rendered: string;
    };
    acf: ACFFields;
}
