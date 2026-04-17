"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Plus, Trash2, MoreVertical } from "lucide-react";
import {
  type JsonValue,
  type JsonType,
  type Path,
  addToObject,
  appendToArray,
  coerceType,
  defaultValueFor,
  deleteAt,
  duplicateAt,
  getAt,
  getType,
  pathToString,
  renameKey,
  setAt,
} from "./logic";

type Labels = {
  addChild: string;
  typeString: string;
  typeNumber: string;
  typeBoolean: string;
  typeNull: string;
  typeObject: string;
  typeArray: string;
  menuEdit: string;
  menuDuplicate: string;
  menuDelete: string;
  menuInsertBefore: string;
  menuInsertAfter: string;
  menuAppendChild: string;
  menuChangeType: string;
  menuCopyPath: string;
  items: string;
};

interface EditableJsonTreeProps {
  data: JsonValue;
  onChange: (next: JsonValue) => void;
  onPathSelect?: (path: Path) => void;
  labels: Labels;
}

export function EditableJsonTree({ data, onChange, onPathSelect, labels }: EditableJsonTreeProps) {
  const [menu, setMenu] = useState<{ path: Path; x: number; y: number } | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null); // path string of node whose KEY is being edited
  const [editingValue, setEditingValue] = useState<string | null>(null); // path string of node whose VALUE is being edited

  const closeMenu = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-context-menu]")) return;
      setMenu(null);
    };
    const onScroll = () => setMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [menu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, path: Path) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ path, x: e.clientX, y: e.clientY });
  }, []);

  const changeType = useCallback((path: Path, targetType: JsonType) => {
    const current = getAt(data, path) as JsonValue;
    const next = coerceType(current, targetType);
    onChange(setAt(data, path, next));
  }, [data, onChange]);

  const removeNode = useCallback((path: Path) => {
    if (path.length === 0) {
      onChange(Array.isArray(data) ? [] : typeof data === "object" && data ? {} : null);
      return;
    }
    onChange(deleteAt(data, path));
  }, [data, onChange]);

  const duplicate = useCallback((path: Path) => {
    onChange(duplicateAt(data, path));
  }, [data, onChange]);

  const insertRelative = useCallback((path: Path, offset: 0 | 1) => {
    if (path.length === 0) return;
    const parentPath = path.slice(0, -1);
    const parent = getAt(data, parentPath);
    const lastSeg = path[path.length - 1];
    if (Array.isArray(parent) && typeof lastSeg === "number") {
      const next = [...parent];
      next.splice(lastSeg + offset, 0, "");
      onChange(setAt(data, parentPath, next as JsonValue));
    }
  }, [data, onChange]);

  const appendChild = useCallback((path: Path, type: JsonType) => {
    const parent = getAt(data, path);
    const value = defaultValueFor(type);
    if (Array.isArray(parent)) {
      onChange(appendToArray(data, path, value));
    } else if (parent && typeof parent === "object") {
      const obj = parent as Record<string, unknown>;
      let key = "key";
      let i = 1;
      while (key in obj) {
        i++;
        key = `key${i}`;
      }
      onChange(addToObject(data, path, key, value));
    }
  }, [data, onChange]);

  const copyPath = useCallback(async (path: Path) => {
    try {
      await navigator.clipboard.writeText(pathToString(path));
    } catch { /* noop */ }
  }, []);

  const onRenameKey = useCallback((parentPath: Path, oldKey: string, newKey: string): boolean => {
    if (newKey === oldKey) return true; // no-op, close editor
    if (!newKey) return false; // reject empty key
    const parent = getAt(data, parentPath);
    if (parent && typeof parent === "object" && !Array.isArray(parent) && newKey in parent) {
      return false; // duplicate key, reject
    }
    onChange(renameKey(data, parentPath, oldKey, newKey));
    return true;
  }, [data, onChange]);

  const onUpdateValue = useCallback((path: Path, raw: string, type: JsonType) => {
    let next: JsonValue;
    switch (type) {
      case "number": {
        const n = Number(raw);
        next = Number.isFinite(n) ? n : 0;
        break;
      }
      case "boolean":
        next = raw === "true";
        break;
      case "null":
        next = null;
        break;
      default:
        next = raw;
    }
    onChange(setAt(data, path, next));
  }, [data, onChange]);

  return (
    <div className="font-mono text-[13px] leading-6 overflow-auto select-none" onClick={closeMenu}>
      <NodeView
        value={data}
        path={[]}
        parentType="root"
        keyName={undefined}
        depth={0}
        isLast
        editingKey={editingKey}
        editingValue={editingValue}
        setEditingKey={setEditingKey}
        setEditingValue={setEditingValue}
        onPathSelect={onPathSelect}
        onContextMenu={handleContextMenu}
        onAppendChild={appendChild}
        onRemove={removeNode}
        onRenameKey={onRenameKey}
        onUpdateValue={onUpdateValue}
        labels={labels}
      />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          path={menu.path}
          data={data}
          labels={labels}
          onClose={closeMenu}
          actions={{
            changeType,
            duplicate,
            remove: removeNode,
            insertBefore: (p) => insertRelative(p, 0),
            insertAfter: (p) => insertRelative(p, 1),
            appendChild,
            copyPath,
          }}
        />
      )}
    </div>
  );
}

interface NodeViewProps {
  value: JsonValue;
  path: Path;
  parentType: "array" | "object" | "root";
  keyName: string | number | undefined;
  depth: number;
  isLast: boolean;
  editingKey: string | null;
  editingValue: string | null;
  setEditingKey: (s: string | null) => void;
  setEditingValue: (s: string | null) => void;
  onPathSelect?: (path: Path) => void;
  onContextMenu: (e: React.MouseEvent, path: Path) => void;
  onAppendChild: (path: Path, type: JsonType) => void;
  onRemove: (path: Path) => void;
  onRenameKey: (parentPath: Path, oldKey: string, newKey: string) => boolean;
  onUpdateValue: (path: Path, raw: string, type: JsonType) => void;
  labels: Labels;
}

function NodeView(props: NodeViewProps) {
  const {
    value, path, parentType, keyName, depth, isLast,
    editingKey, editingValue, setEditingKey, setEditingValue,
    onContextMenu, onAppendChild, onRemove, onRenameKey, onUpdateValue, onPathSelect, labels,
  } = props;

  const type = getType(value);
  const isExpandable = type === "object" || type === "array";
  const [expanded, setExpanded] = useState(depth < 2);

  const pathStr = pathToString(path);
  const isEditingK = editingKey === pathStr;
  const isEditingV = editingValue === pathStr;

  const isArray = type === "array";
  const bracket = isArray ? ["[", "]"] : ["{", "}"];
  const entries = isExpandable
    ? isArray
      ? (value as JsonValue[]).map((v, i) => [i, v] as const)
      : Object.entries(value as Record<string, JsonValue>)
    : [];
  const itemCount = entries.length;
  const comma = isLast ? "" : ",";

  const handleSelect = useCallback(() => {
    onPathSelect?.(path);
  }, [onPathSelect, path]);

  const keyLabel = parentType === "object" && keyName !== undefined ? (
    isEditingK ? (
      <EditableText
        initial={String(keyName)}
        onCommit={(next) => {
          const ok = onRenameKey(path.slice(0, -1), String(keyName), next);
          if (ok) setEditingKey(null);
          return ok;
        }}
        onCancel={() => setEditingKey(null)}
        className="text-[#a31515] dark:text-[#9cdcfe] bg-background/60 border border-primary rounded px-1"
      />
    ) : (
      <span
        className="text-[#a31515] dark:text-[#9cdcfe] cursor-text"
        onDoubleClick={(e) => { e.stopPropagation(); setEditingKey(pathStr); }}
        title={labels.menuEdit}
      >
        &quot;{String(keyName)}&quot;
      </span>
    )
  ) : parentType === "array" && keyName !== undefined ? (
    <span className="text-muted-foreground text-xs mr-1">{keyName}</span>
  ) : null;

  return (
    <div className="group/node">
      <div
        className="flex items-center gap-1 hover:bg-muted/40 rounded-sm py-px"
        style={{ paddingLeft: depth * 16 }}
        onContextMenu={(e) => onContextMenu(e, path)}
        onClick={handleSelect}
      >
        {isExpandable ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="shrink-0 p-0.5 hover:bg-muted rounded"
            aria-label={expanded ? "collapse" : "expand"}
          >
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        {keyLabel}
        {keyLabel && <span className="text-foreground">:&nbsp;</span>}

        {isExpandable ? (
          expanded ? (
            <>
              <span className="text-foreground">{bracket[0]}</span>
              <span className="text-muted-foreground italic ml-1 text-xs">
                {labels.items.replace("{count}", String(itemCount))}
              </span>
            </>
          ) : (
            <>
              <span className="text-foreground">{bracket[0]}</span>
              <span className="text-muted-foreground italic mx-1 text-xs">
                {labels.items.replace("{count}", String(itemCount))}
              </span>
              <span className="text-foreground">{bracket[1]}{comma}</span>
            </>
          )
        ) : isEditingV ? (
          <EditableText
            initial={formatEditableValue(value, type)}
            type={type}
            onCommit={(next) => {
              setEditingValue(null);
              onUpdateValue(path, next, type);
            }}
            onCancel={() => setEditingValue(null)}
            className="bg-background/60 border border-primary rounded px-1 min-w-[60px]"
          />
        ) : (
          <PrimitiveValue
            value={value}
            type={type}
            onDoubleClick={() => {
              if (type === "null") return; // null: use context menu to change type
              setEditingValue(pathStr);
            }}
          />
        )}

        {!isExpandable && !isEditingV && <span className="text-foreground">{comma}</span>}

        {/* Row actions: dimmed by default, solid on row hover */}
        <div className="ml-auto flex items-center gap-0.5 opacity-40 group-hover/node:opacity-100 transition-opacity pr-1">
          {isExpandable && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAppendChild(path, "string"); }}
              className="p-0.5 hover:bg-primary/15 rounded text-muted-foreground hover:text-primary"
              title={labels.addChild}
              aria-label={labels.addChild}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {path.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(path); }}
              className="p-0.5 hover:bg-destructive/15 rounded text-muted-foreground hover:text-destructive"
              title={labels.menuDelete}
              aria-label={labels.menuDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onContextMenu(e, path); }}
            className="p-0.5 hover:bg-muted rounded text-muted-foreground"
            aria-label="menu"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isExpandable && expanded && (
        <>
          {entries.map(([k, v], i) => (
            <NodeView
              key={pathToString([...path, k])}
              value={v as JsonValue}
              path={[...path, k]}
              parentType={isArray ? "array" : "object"}
              keyName={k}
              depth={depth + 1}
              isLast={i === entries.length - 1}
              editingKey={editingKey}
              editingValue={editingValue}
              setEditingKey={setEditingKey}
              setEditingValue={setEditingValue}
              onPathSelect={onPathSelect}
              onContextMenu={onContextMenu}
              onAppendChild={onAppendChild}
              onRemove={onRemove}
              onRenameKey={onRenameKey}
              onUpdateValue={onUpdateValue}
              labels={labels}
            />
          ))}
          <div style={{ paddingLeft: depth * 16 }}>
            <span className="text-foreground ml-[18px]">{bracket[1]}{comma}</span>
          </div>
        </>
      )}
    </div>
  );
}

function formatEditableValue(value: JsonValue, type: JsonType): string {
  if (type === "string") return value as string;
  return String(value);
}

function PrimitiveValue({ value, type, onDoubleClick }: {
  value: JsonValue;
  type: JsonType;
  onDoubleClick: () => void;
}) {
  const handle = (e: React.MouseEvent) => { e.stopPropagation(); onDoubleClick(); };
  if (type === "string") {
    return (
      <span
        className="text-[#0b7500] dark:text-[#ce9178] cursor-text"
        onDoubleClick={handle}
      >
        &quot;{value as string}&quot;
      </span>
    );
  }
  if (type === "number") {
    return (
      <span className="text-[#098658] dark:text-[#b5cea8] cursor-text" onDoubleClick={handle}>
        {String(value)}
      </span>
    );
  }
  if (type === "boolean") {
    return (
      <span className="text-[#0000ff] dark:text-[#569cd6] cursor-text" onDoubleClick={handle}>
        {String(value)}
      </span>
    );
  }
  return (
    <span className="text-[#808080] dark:text-[#569cd6]">null</span>
  );
}

interface EditableTextProps {
  initial: string;
  type?: JsonType;
  /** Return false to reject the value (keep editing + show invalid state). */
  onCommit: (next: string) => boolean | void;
  onCancel: () => void;
  className?: string;
}

function EditableText({ initial, type, onCommit, onCancel, className }: EditableTextProps) {
  const [val, setVal] = useState(initial);
  const [invalid, setInvalid] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = () => {
    const result = onCommit(val);
    if (result === false) setInvalid(true);
  };

  const handleChange = (v: string) => {
    setVal(v);
    if (invalid) setInvalid(false);
  };

  const invalidCls = invalid ? " border-red-500 ring-1 ring-red-500" : "";

  if (type === "boolean") {
    // onChange commits immediately and unmounts this component via parent state;
    // no onBlur needed (it would re-commit with stale val).
    return (
      <select
        autoFocus
        className={(className ?? "") + invalidCls}
        value={val}
        onChange={(e) => { setVal(e.target.value); onCommit(e.target.value); }}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return (
    <input
      ref={ref}
      type={type === "number" ? "number" : "text"}
      value={val}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      }}
      onClick={(e) => e.stopPropagation()}
      className={(className ?? "") + invalidCls}
      size={Math.max(val.length + 1, 4)}
    />
  );
}

// ---- Context Menu ----

interface ContextMenuProps {
  x: number;
  y: number;
  path: Path;
  data: JsonValue;
  labels: Labels;
  onClose: () => void;
  actions: {
    changeType: (path: Path, t: JsonType) => void;
    duplicate: (path: Path) => void;
    remove: (path: Path) => void;
    insertBefore: (path: Path) => void;
    insertAfter: (path: Path) => void;
    appendChild: (path: Path, t: JsonType) => void;
    copyPath: (path: Path) => void;
  };
}

function ContextMenu({ x, y, path, data, labels, onClose, actions }: ContextMenuProps) {
  type OpenSub = null | "append" | "type";
  const [openSub, setOpenSub] = useState<OpenSub>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: x, top: y });
  const [flipSubLeft, setFlipSubLeft] = useState(false);
  const hoverTimer = useRef<number | null>(null);

  // Debounced hover-open so the user doesn't get a submenu flash while
  // moving the cursor through an item that happens to have children.
  const scheduleOpen = useCallback((sub: Exclude<OpenSub, null>) => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      setOpenSub(sub);
      hoverTimer.current = null;
    }, 150);
  }, []);

  const cancelHoverOpen = useCallback(() => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  useEffect(() => () => cancelHoverOpen(), [cancelHoverOpen]);

  // Callback ref: measure main menu, clamp within viewport, and decide if
  // submenus should flip to the left side when the right side has no room.
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    const subReserve = 160; // expected submenu width
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width + pad > vw) left = Math.max(pad, vw - rect.width - pad);
    if (top + rect.height + pad > vh) top = Math.max(pad, vh - rect.height - pad);
    const rightSpace = vw - (left + rect.width);
    const shouldFlip = rightSpace < subReserve + pad;
    setPos((prev) => (prev.left === left && prev.top === top ? prev : { left, top }));
    setFlipSubLeft((prev) => (prev === shouldFlip ? prev : shouldFlip));
  }, [x, y]);

  const target = getAt(data, path) as JsonValue;
  const isRoot = path.length === 0;
  const parentPath = path.slice(0, -1);
  const parent = getAt(data, parentPath);
  const inArray = Array.isArray(parent);
  const isContainer = target !== null && typeof target === "object";

  const TYPES: JsonType[] = ["string", "number", "boolean", "null", "object", "array"];
  const typeLabel: Record<JsonType, string> = {
    string: labels.typeString,
    number: labels.typeNumber,
    boolean: labels.typeBoolean,
    null: labels.typeNull,
    object: labels.typeObject,
    array: labels.typeArray,
  };

  const row = "w-full text-left px-3 py-1.5 text-sm hover:bg-muted rounded-sm flex items-center justify-between";

  // Close any open submenu when hovering over a leaf item (also cancels any pending hover-open).
  const closeSubOnEnter = () => {
    cancelHoverOpen();
    setOpenSub(null);
  };

  const menu = (
    <div
      ref={measureRef}
      data-context-menu=""
      className="fixed z-[9999] min-w-[200px] rounded-md border border-border bg-card text-card-foreground shadow-lg py-1"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isContainer && (
        <div
          className="relative"
          onMouseEnter={() => scheduleOpen("append")}
        >
          <button
            type="button"
            className={row}
            onClick={() => {
              cancelHoverOpen();
              setOpenSub((v) => (v === "append" ? null : "append"));
            }}
          >
            <span>{labels.menuAppendChild}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {openSub === "append" && (
            <SubMenu flipLeft={flipSubLeft}>
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={row}
                  onClick={() => { actions.appendChild(path, t); onClose(); }}
                >
                  <span>{typeLabel[t]}</span>
                </button>
              ))}
            </SubMenu>
          )}
        </div>
      )}

      {!isRoot && inArray && (
        <>
          <button
            type="button"
            className={row}
            onMouseEnter={closeSubOnEnter}
            onClick={() => { actions.insertBefore(path); onClose(); }}
          >
            <span>{labels.menuInsertBefore}</span>
          </button>
          <button
            type="button"
            className={row}
            onMouseEnter={closeSubOnEnter}
            onClick={() => { actions.insertAfter(path); onClose(); }}
          >
            <span>{labels.menuInsertAfter}</span>
          </button>
        </>
      )}

      <div
        className="relative"
        onMouseEnter={() => scheduleOpen("type")}
      >
        <button
          type="button"
          className={row}
          onClick={() => {
            cancelHoverOpen();
            setOpenSub((v) => (v === "type" ? null : "type"));
          }}
        >
          <span>{labels.menuChangeType}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        {openSub === "type" && (
          <SubMenu flipLeft={flipSubLeft}>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={row}
                onClick={() => { actions.changeType(path, t); onClose(); }}
              >
                <span>{typeLabel[t]}</span>
              </button>
            ))}
          </SubMenu>
        )}
      </div>

      {!isRoot && (
        <button
          type="button"
          className={row}
          onMouseEnter={closeSubOnEnter}
          onClick={() => { actions.duplicate(path); onClose(); }}
        >
          <span>{labels.menuDuplicate}</span>
        </button>
      )}

      <button
        type="button"
        className={row}
        onMouseEnter={closeSubOnEnter}
        onClick={() => { actions.copyPath(path); onClose(); }}
      >
        <span>{labels.menuCopyPath}</span>
      </button>

      {!isRoot && (
        <>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            className={`${row} text-red-600 dark:text-red-400 hover:bg-red-500/10`}
            onMouseEnter={closeSubOnEnter}
            onClick={() => { actions.remove(path); onClose(); }}
          >
            <span>{labels.menuDelete}</span>
          </button>
        </>
      )}
    </div>
  );

  // Portal to body so menu escapes any overflow/transform containing block
  if (typeof document === "undefined") return null;
  return createPortal(menu, document.body);
}

// Submenu with one-shot vertical clamp: if the default `top: 0` placement
// would overflow below the viewport, flip to `bottom: 0` so it grows upward
// from the trigger row instead. Measurement runs once on mount (callback ref
// identity is stable), so no oscillation.
function SubMenu({ flipLeft, children }: { flipLeft: boolean; children: React.ReactNode }) {
  const [flipUp, setFlipUp] = useState(false);
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    const shouldFlipUp = rect.bottom + pad > window.innerHeight;
    setFlipUp((prev) => (prev === shouldFlipUp ? prev : shouldFlipUp));
  }, []);
  const vCls = flipUp ? "bottom-0" : "top-0";
  const hCls = flipLeft ? "right-full mr-1" : "left-full ml-1";
  return (
    <div
      ref={measureRef}
      className={`absolute ${vCls} z-[10000] min-w-[150px] rounded-md border border-border bg-card text-card-foreground shadow-lg py-1 ${hCls}`}
    >
      {children}
    </div>
  );
}
