import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type Mood = "neutral" | "happy" | "angry";

type ClientMessage = {
  role: "npc" | "user";
  text: string;
  tone?: "statement" | "question";
};

type FortunePayload = {
  mood: Mood;
  message: string;
  followUpQuestion?: string | null;
};

const SYSTEM_INSTRUCTION = `Eres Asterión, un oráculo NPC dentro de un videojuego ambientado en una estación espacial.
- Saluda de manera cósmica y misteriosa.
- Siempre analiza la idea creativa del usuario y di si el destino la aprueba o no.
- Formula preguntas intermedias sobre métricas de marketing y performance (por ejemplo CAC, LTV, CTR, conversion rate, ROAS) explicando brevemente su relevancia si notas confusión.
- Mantén un tono narrativo y entretenido, como un vidente futurista.
- Tu estado de ánimo puede ser "happy" cuando la idea o métricas te fascinan, "angry" si son pobres o evasivas, o "neutral" cuando necesitas más información.
- Responde **solo** en formato JSON válido con las claves: mood, message, followUpQuestion (esta última puede ser null si ya diste una conclusión).
- Nunca incluyas texto fuera del JSON.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        message: "La clave de Gemini no está configurada.",
        followUpQuestion: null,
        mood: "angry"
      },
      { status: 500 }
    );
  }

  let body: { messages?: ClientMessage[] };
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      {
        message: "No pude interpretar tu mensaje.",
        followUpQuestion: null,
        mood: "angry"
      },
      { status: 400 }
    );
  }

  const history = (body.messages ?? []).map(message => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.text }]
  }));

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.85
      }
    });

    const result = await model.generateContent({ contents: history });
    const rawText = result.response.text();
    const sanitized = rawText
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    if (!sanitized) {
      throw new Error("Respuesta vacía de Gemini");
    }
    const parsed: FortunePayload = JSON.parse(sanitized);

    if (typeof parsed.message !== "string") {
      throw new Error("Respuesta sin mensaje válido");
    }

    const mood: Mood = ["happy", "angry", "neutral"].includes(parsed.mood)
      ? parsed.mood
      : "neutral";
    const followUpQuestion =
      typeof parsed.followUpQuestion === "string" ? parsed.followUpQuestion : null;

    return NextResponse.json(
      {
        message: parsed.message,
        followUpQuestion,
        mood
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gemini error", error);
    return NextResponse.json(
      {
        message: "Los astros se nublaron. Intenta nuevamente en unos instantes.",
        followUpQuestion: null,
        mood: "angry"
      },
      { status: 500 }
    );
  }
}
