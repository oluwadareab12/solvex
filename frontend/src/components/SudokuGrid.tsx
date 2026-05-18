"use client";

import { useCallback } from "react";

interface Props {
  puzzle:    number[];
  solution:  number[];
  onChange?: (idx: number, val: number) => void;
  readonly?: boolean;
  highlight?: Set<number>;
  revealed?:  Set<number>;
}

export function SudokuGrid({ puzzle, solution, onChange, readonly, highlight, revealed }: Props) {
  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) onChange?.(idx, n);
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") onChange?.(idx, 0);
      e.preventDefault();
    },
    [onChange]
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(9, 44px)",
      gridTemplateRows: "repeat(9, 44px)",
      border: "2px solid rgba(255,255,255,0.25)",
      borderRadius: "8px",
      overflow: "hidden",
      width: "fit-content",
    }}>
      {Array.from({ length: 81 }, (_, i) => {
        const row        = Math.floor(i / 9);
        const col        = i % 9;
        const isClue     = puzzle[i] !== 0;
        const value      = isClue ? puzzle[i] : solution[i];
        const isConflict = highlight?.has(i) ?? false;
        const isRevealed = revealed?.has(i) ?? false;

        const bg = isConflict
          ? "rgba(127,29,29,0.6)"
          : isRevealed
          ? "rgba(49,46,129,0.6)"
          : isClue
          ? "#1e293b"
          : "#0f172a";

        const color = isConflict
          ? "#f87171"
          : isRevealed
          ? "#a5b4fc"
          : isClue
          ? "#818cf8"
          : "#f1f5f9";

        const borderRight = col === 2 || col === 5
          ? "2px solid rgba(255,255,255,0.35)"
          : "1px solid rgba(255,255,255,0.08)";
        const borderBottom = row === 2 || row === 5
          ? "2px solid rgba(255,255,255,0.35)"
          : "1px solid rgba(255,255,255,0.08)";

        const cellStyle: React.CSSProperties = {
          width: "44px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          borderRight,
          borderBottom,
          boxSizing: "border-box",
        };

        const textStyle: React.CSSProperties = {
          fontSize: "16px",
          fontWeight: 700,
          color,
          userSelect: "none",
          fontFamily: "var(--font-mono), monospace",
        };

        return (
          <div key={i} style={cellStyle}>
            {isClue || readonly ? (
              <span style={textStyle}>{value !== 0 ? value : ""}</span>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value !== 0 ? String(value) : ""}
                onChange={(e) => {
                  const n = parseInt(e.target.value.slice(-1), 10);
                  if (n >= 1 && n <= 9) onChange?.(idx, n);
                  else onChange?.(idx, 0);
                }}
                onKeyDown={(e) => handleKey(e, i)}
                style={{
                  width: "100%",
                  height: "100%",
                  textAlign: "center",
                  fontSize: "16px",
                  fontWeight: 600,
                  background: "transparent",
                  outline: "none",
                  border: "none",
                  cursor: "text",
                  caretColor: "transparent",
                  color,
                  fontFamily: "var(--font-mono), monospace",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
