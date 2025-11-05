"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

type Mood = "neutral" | "happy" | "angry";

type ChatMessage = {
  id: string;
  role: "npc" | "user";
  text: string;
  mood?: Mood;
  tone?: "statement" | "question";
};

const moodArt: Record<Mood, { src: string; alt: string }> = {
  neutral: {
    src: "/assets/moodNesutro.png",
    alt: "Astronauta neutral"
  },
  happy: {
    src: "/assets/moodFeliz.png",
    alt: "Astronauta feliz"
  },
  angry: {
    src: "/assets/moodFurioso.png",
    alt: "Astronauta furioso"
  }
};

const initialMessage: ChatMessage = {
  id: "intro",
  role: "npc",
  tone: "statement",
  text: "Salud viajero cósmico. Soy Asterión, el oráculo interestelar. Cuéntame tu idea más creativa y revelaré si el destino la aprueba."
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState<Mood>("neutral");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(message => ({
            role: message.role,
            text: message.text,
            tone: message.tone
          }))
        })
      });

      if (!response.ok) {
        throw new Error("La respuesta del oráculo falló");
      }

      const data: {
        message: string;
        followUpQuestion?: string | null;
        mood: Mood;
      } = await response.json();

      const npcMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "npc",
        tone: "statement",
        mood: data.mood,
        text: data.message
      };

      const followUpMessage: ChatMessage | null = data.followUpQuestion
        ? {
            id: crypto.randomUUID(),
            role: "npc",
            tone: "question",
            mood: data.mood,
            text: data.followUpQuestion
          }
        : null;

      setMessages(prev =>
        followUpMessage ? [...prev, npcMessage, followUpMessage] : [...prev, npcMessage]
      );
      setMood(data.mood);
    } catch (error) {
      console.error(error);
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "npc",
        tone: "statement",
        mood: "angry",
        text: "Los vientos solares se han cruzado. Intenta nuevamente más tarde."
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setMood("angry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <section className="card">
        <header className="hero">
          <div className="portrait">
            <Image
              src={moodArt[mood].src}
              alt={moodArt[mood].alt}
              width={240}
              height={240}
              priority
            />
          </div>
          <div className="headline">
            <h1>Oráculo Gemini</h1>
            <p>
              Un NPC visionario canaliza la inteligencia de Gemini para evaluar ideas, enseñar
              métricas de marketing y predecir tu futuro creativo.
            </p>
          </div>
        </header>

        <div className="chat" role="log" aria-live="polite">
          {messages.map(message => (
            <article
              key={message.id}
              className={`bubble bubble-${message.role} ${
                message.tone === "question" ? "bubble-question" : ""
              }`}
            >
              <p>{message.text}</p>
            </article>
          ))}
          <div ref={endRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label htmlFor="idea" className="sr-only">
            Escribe tu idea o responde al oráculo
          </label>
          <input
            id="idea"
            name="idea"
            placeholder="Comparte una idea deslumbrante o responde sus preguntas..."
            value={input}
            onChange={event => setInput(event.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Canalizando..." : "Enviar"}
          </button>
        </form>

        <footer className="footer">
          <p>
            Consejo: describe indicadores como CAC, LTV o CTR para impresionar al oráculo y desbloquear
            visiones más felices.
          </p>
        </footer>
      </section>

      <style jsx>{`
        .container {
          width: min(960px, 100%);
          padding: 24px;
        }

        .card {
          background: rgba(4, 7, 19, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 32px;
          padding: 32px;
          display: grid;
          gap: 24px;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.55);
        }

        .hero {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: center;
        }

        .portrait {
          flex: 0 0 240px;
          display: flex;
          justify-content: center;
        }

        .headline {
          flex: 1;
        }

        h1 {
          margin: 0 0 8px;
          font-size: clamp(2rem, 3vw, 2.5rem);
        }

        p {
          margin: 0;
          line-height: 1.6;
        }

        .chat {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 360px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .bubble {
          padding: 16px 18px;
          border-radius: 20px;
          font-size: 0.95rem;
          line-height: 1.5;
          letter-spacing: 0.01em;
          transition: transform 0.3s ease;
        }

        .bubble-user {
          align-self: flex-end;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.85), rgba(14, 116, 144, 0.85));
          color: #0f172a;
        }

        .bubble-npc {
          align-self: flex-start;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .bubble-question {
          border-color: rgba(251, 191, 36, 0.6);
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.15);
        }

        .composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .composer input {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          padding: 14px 18px;
          font-size: 1rem;
          background: rgba(15, 23, 42, 0.65);
          color: inherit;
        }

        .composer input:focus {
          outline: none;
          border-color: rgba(96, 165, 250, 0.85);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .composer button {
          border-radius: 999px;
          border: none;
          padding: 14px 26px;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.85), rgba(59, 130, 246, 0.85));
          color: #0f172a;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .composer button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
          box-shadow: none;
        }

        .composer button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.35);
        }

        .footer {
          font-size: 0.85rem;
          color: rgba(226, 232, 240, 0.8);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 720px) {
          .card {
            padding: 24px;
          }

          .portrait {
            flex: 1 1 100%;
          }

          .chat {
            max-height: 420px;
          }
        }
      `}</style>
    </main>
  );
}
