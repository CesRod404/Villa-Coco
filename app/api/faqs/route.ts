import { NextResponse } from "next/server";
import { getFAQs } from "@/lib/wp";

export async function GET() {
  const faqs = await getFAQs();

  return NextResponse.json({
    faqs: faqs.map((faq) => ({
      id: faq.id,
      question: faq.acf.question || faq.title.rendered,
      answer: faq.acf.answer,
    })),
  });
}
