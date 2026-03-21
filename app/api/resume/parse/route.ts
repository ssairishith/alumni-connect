// app/api/resume/parse/route.ts
export const runtime = "nodejs";

import { getSession, unauthorized, badRequest, serverError, ok } from "@/lib/auth";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    if (!file) return badRequest("No file uploaded");

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText = "";
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      rawText = parsed.text;
    } catch {
      return badRequest("Could not read PDF. Please try a different file.");
    }

    if (!rawText || rawText.length < 50) {
      return badRequest("The PDF appears to be empty or unreadable.");
    }

    // Trim to reasonable length to avoid token overflow
    const trimmedText = rawText.slice(0, 6000);

    if (!process.env.GROQ_API_KEY) {
      return badRequest("AI resume parsing is not configured (missing GROQ_API_KEY).");
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Extract structured information from resume text and return ONLY valid JSON. No explanation, no markdown, no code blocks. Just the raw JSON object.`,
        },
        {
          role: "user",
          content: `Parse this resume and return a JSON object with exactly these keys:
{
  "full_name": string or null,
  "bio": string (1-2 sentence professional summary) or null,
  "graduation_year": number (4-digit year) or null,
  "current_company": string (most recent employer) or null,
  "job_role": string (most recent job title) or null,
  "skills": array of strings (technical skills, max 15)
}

Resume text:
${trimmedText}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    // Strip any accidental markdown fences
    const cleaned = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Groq returned non-JSON:", content);
      return serverError("AI could not parse the resume. Please fill details manually.");
    }

    return ok({
      full_name: parsed.full_name ?? null,
      bio: parsed.bio ?? null,
      graduation_year: parsed.graduation_year
        ? Number(parsed.graduation_year)
        : null,
      current_company: parsed.current_company ?? null,
      job_role: parsed.job_role ?? null,
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 15) : [],
    });
  } catch (err) {
    console.error("Resume parse error:", err);
    return serverError();
  }
}
