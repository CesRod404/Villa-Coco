"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Image {
    src: string;
    alt?: string;
}

export default function VillaGallery({
    images,
    title,
}: {
    images: Image[];
    title: string;
}) {
    const [selected, setSelected] = useState(0);

    if (!images.length) {
        return (
            <div className="aspect-16/10 bg-gray-200 flex items-center justify-center">
                Sin imágenes
            </div>
        );
    }

    const hasMultiple = images.length > 1;

    const next = () =>
        setSelected((selected + 1) % images.length);

    const prev = () =>
        setSelected((selected - 1 + images.length) % images.length);

    return (
        <div>
            <div className="relative aspect-16/10 overflow-hidden">

                <img
                    src={images[selected].src}
                    alt={images[selected].alt || title}
                    className="w-full h-full object-cover"
                />

                {hasMultiple && (
                    <>
                        <button
                            onClick={prev}
                            aria-label="Imagen anterior"
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center"
                        >
                            <ChevronLeft />
                        </button>

                        <button
                            onClick={next}
                            aria-label="Siguiente imagen"
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center"
                        >
                            <ChevronRight />
                        </button>
                    </>
                )}

            </div>

            {hasMultiple && (
                <div className="flex gap-2 overflow-x-auto p-3">

                    {images.map((image, index) => (

                        <button
                            key={index}
                            onClick={() => setSelected(index)}
                            aria-label={`Ver imagen ${index + 1}`}
                            className={`rounded-lg overflow-hidden border-2 shrink-0
                            ${selected === index
                                    ? "border-cyan-600"
                                    : "border-transparent"}
                            `}
                        >

                            <img
                                src={image.src}
                                alt=""
                                className="w-24 h-16 object-cover"
                            />

                        </button>

                    ))}

                </div>
            )}
        </div>
    );
}