"use client";

import { useCallback } from "react";

interface Props {
  puzzle:   number[];           // 81 values — 0 = blank, 1-9 = clue
  solution: number[];           // user-editable state (81 values)
  onChange?: (idx: number, val: number) => void;
  readonly?: boolean;
  highlight?: Set<number>;      // cell indices to highlight in red (conflicts)
}

export function SudokuGrid({ puzzle, solution, onChange, readonly, highlight }: Props) {
  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        onChange?.(idx, n);
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        onChange?.(idx, 0);
      }
      e.preventDefault();
    },
    [onChange]
  );

  return (
    <div
      className="inline-grid gap-0 border-2 border-white/30 rounded-md overflow-hidden"
      style={{ gridTemplateColumns: "repeat(9, 1fr)" }}
    >
      {Array.from({ length: 81 }, (_, i) => {
        const row  = Math.floor(i / 9);
        const col  = i % 9;
        const isClue    = puzzle[i] !== 0;
        const value     = isClue ? puzzle[i] : solution[i];
        const isConflict = highlight?.has(i) ?? false;

        const borderR = col === 2 || col === 5 ? "border-r-2 border-r-white/40" : "border-r border-r-white/10";
        const borderB = row === 2 || row === 5 ? "border-b-2 border-b-white/40" : "border-b border-b-white/10";

        return (
          <div
            key={i}
            className={[
              "w-10 h-10 flex items-center justify-center",
              borderR, borderB,
              isClue      ? "bg-slate-700"  : "bg-slate-800",
              isConflict  ? "bg-red-900/60" : "",
            ].join(" ")}
          >
            {isClue || readonly ? (
              <span
                className={[
                  "text-base font-bold select-none",
                  isClue      ? "text-indigo-300" : "text-white",
                  isConflict  ? "text-red-400"    : "",
                ].join(" ")}
              >
                {value !== 0 ? value : ""}
              </span>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value !== 0 ? String(value) : ""}
                readOnly
                onKeyDown={(e) => handleKey(e, i)}
                className={[
                  "w-full h-full text-center text-base font-semibold bg-transparent outline-none cursor-pointer caret-transparent",
                  isConflict ? "text-red-400" : "text-white",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
