import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request, { maxRequests: 15, windowMs: 60 * 1000 });
  if (rateLimitResponse) return rateLimitResponse;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf");
  const isTxt = name.endsWith(".txt");
  if (!isPdf && !isTxt) {
    return NextResponse.json({ error: "Only PDF and .txt files are supported" }, { status: 400 });
  }
  try {
    if (isTxt) {
      const text = await file.text();
      return NextResponse.json({ text: text.trim() || "" });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    const text = (result?.text ?? "").trim();
    return NextResponse.json({ text });
  } catch (e) {
    console.error("parse-resume error:", e);
    return NextResponse.json({ error: "Could not extract text from file" }, { status: 500 });
  }
}
