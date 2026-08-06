import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "HubSpot submit API route operational" });
}
