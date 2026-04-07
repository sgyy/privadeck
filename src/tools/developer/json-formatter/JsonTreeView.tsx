"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { evaluateJsonPath } from "./logic";

interface JsonTreeViewProps {
  data: unknown;
  filter?: string;
  defaultExpandLevel?: number;
}

export function JsonTreeView({
  data,
  filter,
  defaultExpandLevel = 2,
}: JsonTreeViewProps) {
  const filtered = useMemo(() => {
    if (!filter || filter === "$" || filter === ".") return data;
    try {
      return evaluateJsonPath(data, filter);
    } catch {
      return data;
    }
  }, [data, filter]);

  return (
    <div className="font-mono text-[13px] leading-6 overflow-auto">
      <JsonNode
        value={filtered}
        depth={0}
        defaultExpandLevel={defaultExpandLevel}
      />
    </div>
  );
}

interface JsonNodeProps {
  keyName?: string;
  value: unknown;
  depth: number;
  defaultExpandLevel: number;
  isLast?: boolean;
}

function JsonNode({
  keyName,
  value,
  depth,
  defaultExpandLevel,
  isLast = true,
}: JsonNodeProps) {
  const isExpandable = value !== null && typeof value === "object";
  const [expanded, setExpanded] = useState(depth < defaultExpandLevel);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const isArray = Array.isArray(value);
  const entries = isExpandable
    ? isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as const)
      : Object.entries(value as Record<string, unknown>)
    : [];
  const itemCount = entries.length;
  const bracket = isArray ? ["[", "]"] : ["{", "}"];
  const comma = isLast ? "" : ",";

  if (!isExpandable) {
    return (
      <div className="flex" style={{ paddingLeft: depth * 16 }}>
        {keyName !== undefined && (
          <>
            <span className="text-[#a31515] dark:text-[#9cdcfe]">
              &quot;{keyName}&quot;
            </span>
            <span className="text-foreground">:&nbsp;</span>
          </>
        )}
        <ValueDisplay value={value} />
        <span className="text-foreground">{comma}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center cursor-pointer hover:bg-muted/50 rounded-sm"
        style={{ paddingLeft: depth * 16 }}
        onClick={toggle}
      >
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ${
            expanded ? "rotate-90" : ""
          }`}
        />
        {keyName !== undefined && (
          <>
            <span className="text-[#a31515] dark:text-[#9cdcfe] ml-1">
              &quot;{keyName}&quot;
            </span>
            <span className="text-foreground">:&nbsp;</span>
          </>
        )}
        {expanded ? (
          <>
            <span className="text-foreground">{bracket[0]}</span>
            <span className="text-muted-foreground italic ml-1 text-xs">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </>
        ) : (
          <>
            <span className="text-foreground">{bracket[0]}</span>
            <span className="text-muted-foreground italic mx-1 text-xs">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="text-foreground">
              {bracket[1]}
              {comma}
            </span>
          </>
        )}
      </div>

      {expanded && (
        <>
          {entries.map(([key, val], i) => (
            <JsonNode
              key={`${i}_${key}`}
              keyName={isArray ? undefined : key}
              value={val}
              depth={depth + 1}
              defaultExpandLevel={defaultExpandLevel}
              isLast={i === entries.length - 1}
            />
          ))}
          <div style={{ paddingLeft: depth * 16 }}>
            <span className="text-foreground ml-[18px]">
              {bracket[1]}
              {comma}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function ValueDisplay({ value }: { value: unknown }) {
  if (typeof value === "string") {
    return (
      <span className="text-[#0b7500] dark:text-[#ce9178]">
        &quot;{value}&quot;
      </span>
    );
  }
  if (typeof value === "number") {
    return (
      <span className="text-[#098658] dark:text-[#b5cea8]">{String(value)}</span>
    );
  }
  if (typeof value === "boolean") {
    return (
      <span className="text-[#0000ff] dark:text-[#569cd6]">
        {String(value)}
      </span>
    );
  }
  if (value === null) {
    return (
      <span className="text-[#808080] dark:text-[#569cd6]">null</span>
    );
  }
  return <span>{String(value)}</span>;
}
