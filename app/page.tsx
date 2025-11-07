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
    alt: "Duende ricotero pensativo"
  },
  happy: {
    src: "/assets/moodFeliz.png",
    alt: "Duende ricotero exaltado"
  },
  angry: {
    src: "/assets/moodFurioso.png",
    alt: "Duende ricotero indignado"
  }
};

const initialMessage: ChatMessage = {
  id: "intro",
  role: "npc",
  tone: "statement",
  text:
    "Bienvenido al Templo Ricotero casjkhd<shjkc<hjk<asfhjksfkhjdsf. Soy el Duende del Destino y leo el porvenir según la mística de los Redondos. Decime cuál es tu canción ricotera preferida y sabremos si sos alma ricotera o apenas un polizón."
};

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState<Mood>("neutral");
  const endRef = useRef<HTMLDivElement>(null);
  const npcMessages = messages.filter(message => message.role === "npc");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [npcMessages.length]);

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
        text: "Los tambores del pogo se desacompasaron. Probá de nuevo en un toque."
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setMood("angry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="scene">
      <div className="responses" role="log" aria-live="polite">
        {npcMessages.map(message => (
          <p
            key={message.id}
            className={`response ${message.tone === "question" ? "response-question" : ""}`}
          >
            {message.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>

      <div className="avatar">
        <Image
          src={moodArt[mood].src}
          alt={moodArt[mood].alt}
          width={280}
          height={280}
          priority
        />
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="idea" className="sr-only">
          Contale tu canción ricotera o respondé al oráculo
        </label>
        <input
          id="idea"
          name="idea"
          placeholder="Confesá tu canción ricotera o contestá su prueba..."
          value={input}
          onChange={event => setInput(event.target.value)}
          disabled={isLoading}
          autoComplete="off"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Invocando al Indio..." : "Consultar"}
        </button>
      </form>

      <style jsx>{`
        .scene {
          width: min(680px, 100%);
          margin: 0 auto;
          padding: 56px 16px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          text-align: center;
        }

        .responses {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-height: 360px;
          overflow-y: auto;
          padding: 0 8px;
        }

        .response {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.6;
          letter-spacing: 0.08em;
          color: rgba(248, 250, 252, 0.9);
          text-shadow: 0 0 8px rgba(15, 118, 110, 0.45);
        }

        .response-question {
          color: #facc15;
          text-shadow: 0 0 10px rgba(250, 204, 21, 0.6);
        }

        .avatar {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 12px;
          border: 2px solid rgba(148, 163, 184, 0.4);
          background: rgba(8, 11, 27, 0.65);
          box-shadow: 0 0 24px rgba(14, 116, 144, 0.45);
        }

        .composer {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          align-items: center;
        }

        .composer input {
          border: 2px solid rgba(148, 163, 184, 0.6);
          background: rgba(4, 7, 19, 0.85);
          color: inherit;
          padding: 18px 16px 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.65rem;
        }

        .composer input:focus {
          outline: none;
          border-color: #38bdf8;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.2);
        }

        .composer button {
          border: 2px solid rgba(56, 189, 248, 0.8);
          background: rgba(15, 23, 42, 0.9);
          color: #38bdf8;
          padding: 16px 24px 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.65rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .composer button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.45);
        }

        .composer button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
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
          .scene {
            padding-top: 32px;
            gap: 24px;
          }

          .responses {
            max-height: 280px;
          }

          .composer {
            grid-template-columns: 1fr;
          }

          .composer button {
            justify-self: center;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
