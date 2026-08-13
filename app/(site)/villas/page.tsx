/**
 * app/(site)/page.tsx
 */

import { getVillas, getTestimonials } from "@/lib/wp";
import Hero from "@/components/home/Hero";
import IntroSection from "@/components/home/IntroSection";
import VillasSection from "@/components/home/VillasSection";
import MixMatchSection from "@/components/home/MixMatchSection";
import Testimonials from "@/components/testimonials/Testimonials";

export default async function HomePage() {
  const [villas, testimonios] = await Promise.all([
    getVillas(),
    getTestimonials(),
  ]);

  return (
    <main>
      <Hero />
      <IntroSection />
      <VillasSection villas={villas} />
      <MixMatchSection />
      <Testimonials testimonios={testimonios} villas={villas} />
    </main>
  );
}