"use client";

import VillaGallery from "./VillaGallery"; 
import Link from "next/link";
import React from "react";
import { Villa } from "../../types/wordpress";

function stripHtml(html?: string) {
	if (!html) return "";
	return html.replace(/<[^>]*>/g, "").slice(0, 140);
}

function extractImages(villa: Villa) {
	const images: { src: string; alt?: string }[] = [];

	// Prefer featured media embedded (same as page.tsx)
	const featured = (villa as any)._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
	const featuredAlt = (villa as any)._embedded?.["wp:featuredmedia"]?.[0]?.alt_text || "";
	if (featured) images.push({ src: featured, alt: featuredAlt });

	// Then fallback to ACF gallery (strings or objects)
	const acfGallery: any = villa.acf?.gallery;
	if (Array.isArray(acfGallery) && acfGallery.length > 0) {
		for (const it of acfGallery) {
			if (typeof it === "string") images.push({ src: it, alt: "" });
			else if (it && (it.url || it.src)) images.push({ src: it.url || it.src, alt: it.alt || "" });
		}
	}

	return images;
}

export default function VillaCard({ villa }: { villa: Villa }) {
	const title = villa.title?.rendered || "Untitled";
	const excerpt = (villa as any).excerpt?.rendered || villa.acf?.description_short || villa.content?.rendered || "";
	const images = extractImages(villa);
	const mainImage = images.length ? images[0].src : "/placeholder.jpg";
	const alt = images.length ? images[0].alt || title : title;

	return (
		<article className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
			<VillaGallery
                images={images}
                title={title}
            />

			<div className="p-5 flex-1 flex flex-col justify-between">
				<div>
					<div className="flex items-center justify-between gap-2 mb-2">
						<h3 className="text-xl font-bold text-slate-900" dangerouslySetInnerHTML={{ __html: title }} />
						{villa.acf?.location && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">📍 {villa.acf.location}</span>}
					</div>

					<p className="text-slate-600 mb-4 text-sm line-clamp-3">{villa.acf?.description_short || stripHtml(excerpt)}</p>

					{/* Especificaciones */}
					<div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs text-slate-600 text-center mb-4">
						<div>
							<span className="font-bold text-slate-800 block text-sm">{villa.acf?.bedrooms || "-"}</span>
							Recámaras
						</div>
						<div>
							<span className="font-bold text-slate-800 block text-sm">{villa.acf?.bathrooms || "-"}</span>
							Baños
						</div>
						<div>
							<span className="font-bold text-slate-800 block text-sm">{villa.acf?.suites_count || "-"}</span>
							Suites
						</div>
					</div>

					{/* Casos de uso */}
					{villa.acf?.use_cases && villa.acf.use_cases.length > 0 && (
						<div className="flex gap-1.5 flex-wrap mb-4">
							{villa.acf.use_cases.map((useCase, index) => (
								<span key={index} className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-100 capitalize">
									{useCase}
								</span>
							))}
						</div>
					)}
				</div>

				<Link href={`/villas/${villa.slug}`} className="w-full inline-block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">
					Ver detalles y disponibilidad
				</Link>
			</div>
		</article>
	);
}

