"use client";

import { useState } from "react";
import type { ChatMessage } from "@/features/chat/types";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { speakText, stopSpeech } from "@/lib/utils/audio-speaker";
import type { Language } from "@/lib/i18n/translations";
import { Volume2, VolumeX, Copy, Check, Sparkles } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  masterAstrologerLabel: string;
  groundedInChartLabel: string;
  language?: Language;
  onHighlightHouse?: (house: number) => void;
}

export function ChatMessageBubble({
  message,
  masterAstrologerLabel,
  groundedInChartLabel,
  language = "en",
  onHighlightHouse,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      stopSpeech();
      setIsPlayingAudio(true);
      speakText(message.text, {
        language,
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
      });
    }
  };

  const isUser = message.sender === "user";

  if (isUser) {
    return (
      <div className="group ml-auto flex max-w-[85%] animate-fade-in flex-col items-end space-y-1 sm:max-w-[78%]">
        <div className="relative rounded-[12px] rounded-br-[4px] border border-acc/30 bg-acc/10 px-4 py-3 text-xs leading-relaxed text-fg sm:text-sm">
          <p className="whitespace-pre-wrap">{message.text}</p>
          <button
            onClick={handleCopy}
            className="absolute -left-8 top-1/2 -translate-y-1/2 rounded-[6px] p-1.5 text-mut opacity-0 transition-opacity hover:text-fg group-hover:opacity-100"
            title="Copy message"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </button>
        </div>
        <span className="px-1 text-[9px] text-dim">{message.timestamp}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start space-y-2 max-w-[92%] sm:max-w-[88%] animate-fade-in group">
      {/* Who is speaking, and the quiet tools */}
      <div className="flex w-full items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-inset font-serif text-[11px] font-bold text-acc">
            ॐ
          </span>
          <span className="font-serif text-xs font-bold text-acc2">{masterAstrologerLabel}</span>
          <span className="text-[9px] text-dim">{message.timestamp}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleToggleAudio}
            className={`cursor-pointer rounded-[6px] p-1.5 transition ${
              isPlayingAudio ? "text-acc2" : "text-mut hover:text-fg"
            }`}
            title={isPlayingAudio ? "Stop Audio" : "Listen Audio"}
          >
            {isPlayingAudio ? <VolumeX className="size-3.5 animate-pulse" /> : <Volume2 className="size-3.5" />}
          </button>
          <button
            onClick={handleCopy}
            className="cursor-pointer rounded-[6px] p-1.5 text-mut transition hover:text-fg"
            title="Copy Astrologer Response"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="relative w-full space-y-3 rounded-[12px] rounded-tl-[4px] border border-brd bg-panel px-4 py-3.5 text-xs leading-relaxed text-fg sm:text-sm">
        <MarkdownRenderer content={message.text} />
        {message.astrologicalBasis && (
          <button
            onClick={() => {
              if (onHighlightHouse) {
                const house = message.text.includes("7th") ? 7 : 10;
                onHighlightHouse(house);
              }
            }}
            title={groundedInChartLabel}
            className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-full border border-brd bg-inset px-2.5 py-1 text-[10px] font-medium text-mid transition hover:border-acc/50 hover:text-acc2 active:scale-95"
          >
            <Sparkles className="size-3 text-acc" />
            <span className="truncate">{message.astrologicalBasis}</span>
          </button>
        )}
      </div>
    </div>
  );
}
