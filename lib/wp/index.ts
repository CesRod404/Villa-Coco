import { Villa } from "../../types/wordpress";

const API_URL = process.env.WORDPRESS_API_URL || "http://localhost:8881/wp-json/wp/v2";

export async function getVillas(): Promise<Villa[]> {
  try {
    const res = await fetch(`${API_URL}/villa`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`Error de la API de WordPress: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error("No se pudo conectar a la API de WordPress en:", API_URL, error);
    return [];
  }
}
