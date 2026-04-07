"use client";

import { useMemo } from "react";
import { tokenizeJson, type Token } from "./logic";

interface SyntaxHighlightProps {
  code: string;
}

const TOKEN_COLORS: Record<string, string> = {
  key: "text-[#a31515] dark:text-[#9cdcfe]",
  string: "text-[#0b7500] dark:text-[#ce9178]",
  number: "text-[#098658] dark:text-[#b5cea8]",
  boolean: "text-[#0000ff] dark:text-[#569cd6]",
  null: "text-[#808080] dark:text-[#569cd6]",
  punctuation: "text-foreground",
};

export function SyntaxHighlight({ code }: SyntaxHighlightProps) {
  const lines = useMemo(() => {
    if (!code) return [];
    const tokens = tokenizeJson(code);
    // Split tokens into lines
    const result: Token[][] = [[]];
    for (const token of tokens) {
      if (token.type === "punctuation" && token.value.includes("\n")) {
        const parts = token.value.split("\n");
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) {
            result[result.length - 1].push({ type: "punctuation", value: parts[i] });
          }
          if (i < parts.length - 1) {
            result.push([]);
          }
        }
      } else {
        result[result.length - 1].push(token);
      }
    }
    return result;
  }, [code]);

  if (!code) return null;

  return (
    <div className="font-mono text-[13px] leading-6 overflow-auto">
      <table className="border-collapse">
        <tbody>
          {lines.map((lineTokens, i) => (
            <tr key={i} className="hover:bg-muted/30">
              <td className="select-none pr-4 pl-2 text-right text-muted-foreground/50 align-top w-[1%] whitespace-nowrap">
                {i + 1}
              </td>
              <td className="whitespace-pre">
                {lineTokens.map((token, j) => (
                  <span key={j} className={TOKEN_COLORS[token.type]}>
                    {token.value}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
