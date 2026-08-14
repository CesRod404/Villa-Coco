"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Home, HelpCircle, Users } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  needsHumanHelp?: boolean;
};

type Faq = {
  id: number;
  question: string;
  answer: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you learn about our villas at Coco B. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [showQuickActions, setShowQuickActions] = useState(true);
  const [faqMode, setFaqMode] = useState(false);
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [faqsLoading, setFaqsLoading] = useState(false);

  useEffect(() => {
    function closeChatWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeChatWithEscape);

    return () => {
      window.removeEventListener("keydown", closeChatWithEscape);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function handleSend(presetText?: string) {
    const trimmed = (presetText ?? input).trim();
    if (!trimmed || isLoading) return;

    setShowQuickActions(false);
    setFaqMode(false);

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    if (!presetText) setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
        needsHumanHelp: Boolean(data.needsHumanHelp),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError(
        "I couldn't send that message. Please try again or reach out through our contact form."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function openFaqs() {
    setShowQuickActions(false);
    setFaqMode(true);
    if (faqs) return; // ya cargadas, no volver a pedirlas

    setFaqsLoading(true);
    try {
      const res = await fetch("/api/faqs");
      const data = await res.json();
      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
    } catch (err) {
      console.error("Error cargando FAQs:", err);
      setFaqs([]);
    } finally {
      setFaqsLoading(false);
    }
  }

  function selectFaq(faq: Faq) {
    setFaqMode(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: faq.question },
      { role: "assistant", content: faq.answer },
    ]);
  }

  function talkToTeam() {
    setShowQuickActions(false);
    setFaqMode(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Talk to our team" },
      {
        role: "assistant",
        content:
          "Of course! You can reach our team directly through this form and we'll get back to you shortly.",
        needsHumanHelp: true,
      },
    ]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          id="villa-coco-chat"
          role="dialog"
          aria-label="Coco B Assistant"
          className="flex h-[min(24rem,calc(100svh-3rem))] w-[min(21.25rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-200 bg-primary px-4 py-3">
            <span className="text-sm font-medium text-primary-foreground">
              Coco B Assistant
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-primary-foreground/80 hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Botón de contacto — solo cuando la IA no pudo ayudar
                    (needsHumanHelp true, viene de /api/chat). */}
                {msg.role === "assistant" && msg.needsHumanHelp && (
                  <a
                    href="/villas/casa-coco#reservation"
                    className="text-button rounded-md bg-secondary px-4 py-2 text-center uppercase text-white"
                  >
                    Contact Our Team
                  </a>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl bg-gray-100 px-3 py-2 text-sm text-black/60">
                  Typing…
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-xs text-red-600">{error}</div>
            )}

            {/* Chips iniciales — solo antes de que el usuario interactúe */}
            {showQuickActions && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSend("What villas do you have?")}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-primary"
                >
                  <Home className="h-3.5 w-3.5 text-primary" /> See our villas
                </button>
                <button
                  type="button"
                  onClick={openFaqs}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-primary"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-primary" /> FAQs
                </button>
                <button
                  type="button"
                  onClick={talkToTeam}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-primary"
                >
                  <Users className="h-3.5 w-3.5 text-primary" /> Talk to our team
                </button>
              </div>
            )}

            {/* Lista de FAQs reales — sin llamar a la IA */}
            {faqMode && (
              <div className="flex flex-col gap-2 pt-1">
                {faqsLoading && (
                  <p className="text-xs text-muted">Loading questions…</p>
                )}
                {!faqsLoading && faqs?.length === 0 && (
                  <p className="text-xs text-muted">
                    No FAQs available right now.
                  </p>
                )}
                {!faqsLoading &&
                  faqs?.map((faq) => (
                    <button
                      key={faq.id}
                      type="button"
                      onClick={() => selectFaq(faq)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-secondary transition-colors hover:border-primary"
                    >
                      {faq.question}
                    </button>
                  ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-end gap-2 border-t border-gray-200 px-3 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante — SIEMPRE visible, controla su propio estado.
          No depende de ningún otro botón de la página para existir. */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        aria-controls="villa-coco-chat"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:opacity-90"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}