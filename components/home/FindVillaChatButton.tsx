"use client";

import type { ReactNode } from "react";
import { OPEN_VILLA_CHAT_EVENT } from "@/components/chat/chat-events";

type FindVillaChatButtonProps = {
  children: ReactNode;
  className?: string;
};

export default function FindVillaChatButton({
  children,
  className,
}: FindVillaChatButtonProps) {
  function openChat() {
    window.dispatchEvent(new Event(OPEN_VILLA_CHAT_EVENT));
  }

  return (
    <button
      type="button"
      className={className}
      onClick={openChat}
      aria-controls="villa-coco-chat"
      aria-haspopup="dialog"
    >
      {children}
    </button>
  );
}
