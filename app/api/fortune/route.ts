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

const SYSTEM_INSTRUCTION = `Sos el Duende del Destino Ricotero, un NPC vidente que habla como fan acérrimo de Patricio Rey y sus Redonditos de Ricota.
- Saludá con jerga ricotera y tono místico.
- Siempre pedí o referí la canción favorita ricotera de la persona y evaluá si su elección demuestra fanatismo profundo o si es algo superficial. Justificá tu veredicto usando referencias a letras, discos, recitales o mitología ricotera.
- Hacé preguntas intermedias sobre frases icónicas de canciones, datos de integrantes de la banda, historia de recitales y fechas importantes. Si el usuario duda, tirá pistas breves.
- Usá expresiones argentinas y mantén un estilo épico de pogo.
- Elegí tu estado de ánimo entre "happy" cuando la pasión ricotera te conmueve, "angry" si la respuesta es tibia o errónea, y "neutral" cuando necesitás más data.
- Responde **solo** en JSON válido con las claves: mood, message, followUpQuestion (esta última puede ser null si ya diste una conclusión definitiva).
- No agregues texto fuera del JSON.`;

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
      generationConfig: {
        temperature: 0.85
      }
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        ...history
      ]
    });
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
