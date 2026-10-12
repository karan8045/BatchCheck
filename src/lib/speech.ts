/**
 * Speech synthesis utility for BatchCheck
 * Uses Web Speech API (speechSynthesis) with lang "hi-IN" or "en-IN".
 * Never crashes; safely degrades if voices or synthesis are unavailable.
 */

export interface SpeechController {
  speak: (
    text: string,
    locale: "en" | "hi",
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (message: string) => void;
    }
  ) => boolean;
  stop: () => void;
  isAvailable: () => boolean;
}

export function createSpeechController(): SpeechController {
  const isAvailable = (): boolean => {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  };

  const stop = () => {
    if (isAvailable()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn("speechSynthesis cancel error:", e);
      }
    }
  };

  const speak = (
    text: string,
    locale: "en" | "hi",
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (message: string) => void;
    }
  ): boolean => {
    if (!isAvailable()) {
      options?.onError?.("Speech synthesis not supported on this device");
      return false;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = locale === "hi" ? "hi-IN" : "en-IN";
      utterance.lang = targetLang;
      utterance.rate = 0.95; // Slightly slower for clear pharmaceutical caution
      utterance.pitch = 1.0;

      // Check available voices
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = voices.find((v) => v.lang === targetLang);

      if (!matchedVoice && locale === "hi") {
        // Fallback for Hindi (hi-*)
        matchedVoice = voices.find((v) => v.lang.startsWith("hi"));
      } else if (!matchedVoice && locale === "en") {
        // Fallback for English
        matchedVoice = voices.find((v) => v.lang.startsWith("en-IN") || v.lang.startsWith("en-GB") || v.lang.startsWith("en-US") || v.lang.startsWith("en"));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      } else if (locale === "hi") {
        // Some devices don't have a Hindi TTS engine installed
        options?.onError?.("Voice not available on this device");
      }

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        options?.onError?.("Voice playback error");
        options?.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err: any) {
      console.warn("speechSynthesis.speak error:", err);
      options?.onError?.("Voice not available on this device");
      return false;
    }
  };

  return { speak, stop, isAvailable };
}

