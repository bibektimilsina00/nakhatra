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
      <div className="flex flex-col items-end space-y-1.5 ml-auto max-w-[85%] sm:max-w-[78%] animate-fade-in group">
        <div className="relative rounded-[14px] rounded-tr-[2px] bg-gradient-to-r from-acc via-[#F3C766] to-acc p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-onacc shadow-[0_4px_25px_rgba(229,169,60,0.22)] border border-acc2/60 leading-relaxed transition-all">
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* Floating Copy Action on Hover */}
          <button
            onClick={handleCopy}
            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-[6px] bg-panel border border-brd text-mut hover:text-acc2 text-[10px]"
            title="Copy message"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </button>
        </div>
        <span className="text-[10px] font-medium text-mut/60 px-1">{message.timestamp}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start space-y-2 max-w-[92%] sm:max-w-[88%] animate-fade-in group">
      {/* Header Avatar & Metadata Bar */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2">
          <div className="relative size-6 rounded-full bg-gradient-to-br from-acc to-acc2 text-onacc flex items-center justify-center font-serif text-[11px] font-bold shadow-md ring-2 ring-acc/30">
            <span>🕉️</span>
          </div>
          <span className="text-xs font-serif font-bold text-acc tracking-wide">
            {masterAstrologerLabel}
          </span>
          <span className="text-[10px] text-mut/60">• {message.timestamp}</span>
        </div>

        {/* Quick Action Tools: Speak Audio & Copy */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleAudio}
            className={`p-1.5 rounded-[6px] border text-[11px] transition-all cursor-pointer ${
              isPlayingAudio
                ? "bg-acc/20 border-acc text-acc2"
                : "bg-inset border-brd text-mut hover:text-fg hover:border-brd2"
            }`}
            title={isPlayingAudio ? "Stop Audio" : "Listen Audio"}
          >
            {isPlayingAudio ? (
              <VolumeX className="size-3.5 text-amber-300 animate-pulse" />
            ) : (
              <Volume2 className="size-3.5 text-mut" />
            )}
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-[6px] bg-inset border border-brd text-mut hover:text-fg hover:border-brd2 text-[11px] transition-all cursor-pointer"
            title="Copy Astrologer Response"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Astrologer Message Card Body with Markdown */}
      <div className="w-full rounded-[14px] rounded-tl-[2px] border border-brd bg-gradient-to-br from-[#161B2B] via-[#121625] to-[#0D0F19] p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-fg shadow-xl space-y-3 relative">
        <MarkdownRenderer content={message.text} />

        {/* Grounded Message Bubbles */}
        {message.astrologicalBasis && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-brd pt-3 text-[11px]">
            <span className="text-acc font-semibold flex items-center gap-1">
              <span>📍</span> {groundedInChartLabel}:
            </span>
            <button
              onClick={() => {
                if (onHighlightHouse) {
                  const house = message.text.includes("7th") ? 7 : 10;
                  onHighlightHouse(house);
                }
              }}
              className="rounded-[8px] bg-inset border border-acc/40 px-2.5 py-1 text-acc2 hover:bg-acc/15 hover:border-acc transition shadow-sm font-medium flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="size-3 text-acc" />
              <span>{message.astrologicalBasis}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
