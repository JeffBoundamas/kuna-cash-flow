import { cn } from "@/lib/utils";
import { Delete, Mic, MicOff } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

interface CalculatorKeypadProps {
  value: string;
  onChange: (value: string) => void;
}

const CalculatorKeypad = ({ value, onChange }: CalculatorKeypadProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const append = useCallback(
    (char: string) => {
      // Prevent multiple dots
      if (char === "." && value.includes(".")) return;
      // Prevent leading zeros
      if (value === "0" && char !== ".") {
        onChange(char);
        return;
      }
      onChange(value + char);
    },
    [value, onChange]
  );

  const backspace = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [value, onChange]);

  const clear = useCallback(() => {
    onChange("");
  }, [onChange]);

  // Voice input
  const supportsVoice =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleVoice = useCallback(() => {
    if (!supportsVoice) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Extract numbers from speech
      const numbers = transcript.replace(/\s/g, "").match(/\d+/g);
      if (numbers) {
        onChange(numbers.join(""));
      }
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [supportsVoice, isListening, onChange]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["00", "0", "del"],
  ];

  return (
    <div className="space-y-2 w-full overflow-hidden">
      {/* Display */}
      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 min-w-0">
        <span className="text-xs text-muted-foreground">XAF</span>
        <span className="text-2xl font-bold font-display text-foreground tabular-nums truncate">
          {value
            ? parseInt(value).toLocaleString("fr-FR").replace(/,/g, " ")
            : "0"}
        </span>
      </div>

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-1 w-full min-w-0">
        {keys.flat().map((key) => {
          if (key === "del") {
            return (
              <button
                key={key}
                onClick={backspace}
                onDoubleClick={clear}
                className="flex h-11 items-center justify-center rounded-lg bg-muted text-muted-foreground active:bg-border transition-colors min-w-0 overflow-hidden"
                aria-label="Supprimer"
              >
                <Delete className="h-5 w-5" />
              </button>
            );
          }
          return (
            <button
              key={key}
              onClick={() => append(key)}
              className="flex h-11 items-center justify-center rounded-lg bg-card border border-border text-base font-semibold font-display text-foreground active:bg-muted transition-colors min-w-0 overflow-hidden"
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Voice button */}
      {supportsVoice && (
        <button
          onClick={toggleVoice}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-all",
            isListening
              ? "bg-destructive/10 text-destructive animate-pulse"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Écoute en cours…
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Dicter le montant
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CalculatorKeypad;
