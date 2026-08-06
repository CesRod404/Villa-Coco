import Link from "next/link";
import { getVillas } from "@/lib/wp";
import VillaCard from "@/components/villa/VillaCard";

export default async function VillasPage() {
    const villas = await getVillas();

    return (
        <main className="container mx-auto p-6 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Nuestras Villas</h1>
                    <p className="text-slate-600 text-sm mt-1">
                        Propiedades exclusivas frente al mar en Isla Mujeres. Modelo de reserva bajo solicitud (*request-only*).
                    </p>
                </div>
            </div>

            {villas.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl bg-amber-50 border-amber-200 text-center">
                    <p className="text-amber-800 font-semibold mb-2">
                        No se pudieron cargar las villas desde WordPress.
                    </p>
                    <p className="text-sm text-amber-700">
                        Asegúrate de que tu servidor de WordPress esté corriendo en{" "}
                        <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">
                            {process.env.WORDPRESS_API_URL || "http://localhost:8881/wp-json/wp/v2"}
                        </code>
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {villas.map((villa) => (
                        <VillaCard key={villa.id} villa={villa} />
                    ))}
                </div>
            )}
        </main>
    );
}
