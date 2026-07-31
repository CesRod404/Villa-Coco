export default async function VillaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 capitalize">Villa: {slug}</h1>
      <p className="text-slate-600">Página de detalle para la villa {slug}.</p>
    </main>
  );
}
