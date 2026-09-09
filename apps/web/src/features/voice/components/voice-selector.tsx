"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import { useDismissable } from "@/components/ui/use-dismissable";
import { ASTROLOGER_VOICES, type AstrologerVoice } from "@/lib/constants/voices";
import { speakText, stopSpeech } from "@/lib/utils/audio-speaker";
import type { Language } from "@/lib/i18n/language-context";
import {
  Play,
  Pause,
  ChevronDown,
  Check,
  Mic,
} from "lucide-react";

interface CustomVoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  language: Language;
  className?: string;
}

export function CustomVoiceSelector({
  selectedVoice,
  onSelectVoice,
  language,
  className = "",
}: CustomVoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVoiceObj =
    ASTROLOGER_VOICES.find((v) => v.id === selectedVoice) || ASTROLOGER_VOICES[0];

  // Closes on an outside click or Escape. It used to handle only the first,
  // and kept the listener attached even while closed.
  useDismissable(isOpen, containerRef, useCallback(() => setIsOpen(false), []));

  // Stop preview audio if component unmounts or dropdown closes
  useEffect(() => {
    if (!isOpen && previewingVoiceId) {
      stopSpeech();
      setPreviewingVoiceId(null);
    }
  }, [isOpen, previewingVoiceId]);

  const handleTogglePreview = (e: React.MouseEvent, voice: AstrologerVoice) => {
    e.stopPropagation();

    if (previewingVoiceId === voice.id) {
      stopSpeech();
      setPreviewingVoiceId(null);
      return;
    }

    stopSpeech();
    setPreviewingVoiceId(voice.id);

    const previewTexts: Record<Language, string> = {
      en: `Namaste. I am ${voice.name}, your Vedic astrologer.`,
      ne: `नमस्ते, म ${voice.name}, तपाईंको वैदिक ज्योतिषी।`,
      hi: `नमस्ते, मैं ${voice.name}, आपका वैदिक ज्योतिषी।`,
    };

    const textToSpeak = previewTexts[language] || previewTexts.en;

    speakText(textToSpeak, {
      voice: voice.id,
      language,
      rate: 1.0,
      onEnd: () => {
        setPreviewingVoiceId((prev) => (prev === voice.id ? null : prev));
      },
    });
  };

  const handleSelect = (voiceId: string) => {
    stopSpeech();
    setPreviewingVoiceId(null);
    onSelectVoice(voiceId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center justify-between gap-2.5 rounded-[8px] border border-acc/40 bg-inset px-3 py-1.5 text-xs font-semibold text-acc2 transition-all duration-200 hover:border-acc hover:bg-panel hover:shadow-md cursor-pointer active:scale-95"
        title="Choose Astrologer Voice with Audio Preview"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <Mic className="size-3.5 text-acc shrink-0" />
          <span className="text-xs font-bold text-fg">
            {currentVoiceObj.name}
          </span>
        </div>

        <ChevronDown
          className={`size-3.5 text-acc2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-[8px] border border-acc/30 bg-panel p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between border-b border-brd px-2.5 pb-2 pt-1">
            <div className="flex items-center gap-1.5">
              <Mic className="size-3.5 text-acc" />
              <span className="text-xs font-bold text-fg">
                {language === "ne"
                  ? "ज्योतिषी स्वर चयन गर्नुहोस्"
                  : language === "hi"
                  ? "ज्योतिषी स्वर चुनें"
                  : "Select Astrologer Voice"}
              </span>
            </div>
            <span className="text-[10px] text-mut">
              {language === "ne"
                ? "पूर्वावलोकन सुन्नुहोस्"
                : language === "hi"
                ? "पूर्वावलोकन सुनें"
                : "Listen Preview"}
            </span>
          </div>

          {/* Voice Items List */}
          <div className="mt-1.5 max-h-72 overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:thin] [scrollbar-color:#E5A93C/30_transparent]">
            {ASTROLOGER_VOICES.map((voice) => {
              const isSelected = voice.id === selectedVoice;
              const isPreviewing = previewingVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => handleSelect(voice.id)}
                  className={`group relative flex items-center justify-between rounded-[6px] p-2.5 text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-acc/15 border border-acc/50 text-fg"
                      : "hover:bg-fg/5 border border-transparent text-mid"
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                    {/* Selected Checkmark */}
                    <div className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-brd2">
                      {isSelected && <Check className="size-3 text-acc" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-fg truncate">
                          {voice.name}
                        </span>
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-[4px] bg-fg/10 text-mut">
                          {voice.gender}
                        </span>
                      </div>
                      <p className="text-[10px] text-mut line-clamp-1 mt-0.5">
                        {voice.description[language] || voice.description.en}
                      </p>
                    </div>
                  </div>

                  {/* Sound Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => handleTogglePreview(e, voice)}
                    title={
                      isPreviewing
                        ? "Stop Preview"
                        : `Preview ${voice.name}'s voice`
                    }
                    className={`flex size-8 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-150 cursor-pointer active:scale-95 ${
                      isPreviewing
                        ? "border-acc bg-acc text-onacc shadow-md shadow-acc/30"
                        : "border-brd bg-inset text-acc hover:border-acc hover:bg-acc/20"
                    }`}
                  >
                    {isPreviewing ? (
                      <Pause className="size-3.5 fill-current" />
                    ) : (
                      <Play className="size-3.5 fill-current ml-0.5 transition-transform group-hover:scale-110" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
