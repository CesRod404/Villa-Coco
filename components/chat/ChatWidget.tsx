"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you learn about our villas and wellness retreats at Coco B. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 flex h-120 w-85 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-primary px-4 py-3">
            <span className="text-sm font-medium text-primary-foreground">
              Coco B Assistant
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-primary-foreground/80 hover:text-primary-foreground"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  {msg.content}
                </div>
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

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-gray-200 px-3 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about villas, retreats…"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}