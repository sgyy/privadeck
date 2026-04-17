export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };
export type JsonType = "string" | "number" | "boolean" | "null" | "object" | "array";
export type PathSegment = string | number;
export type Path = PathSegment[];

export function getType(value: unknown): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

export function pathToString(path: Path): string {
  if (path.length === 0) return "$";
  let out = "$";
  for (const seg of path) {
    if (typeof seg === "number") out += `[${seg}]`;
    else if (/^[a-zA-Z_$][\w$]*$/.test(seg)) out += `.${seg}`;
    else out += `["${seg.replace(/"/g, '\\"')}"]`;
  }
  return out;
}

function cloneShallow<T>(value: T): T {
  if (Array.isArray(value)) return [...value] as unknown as T;
  if (value && typeof value === "object") return { ...(value as object) } as T;
  return value;
}

export function getAt(root: unknown, path: Path): unknown {
  let cur: unknown = root;
  for (const seg of path) {
    if (cur == null) return undefined;
    if (Array.isArray(cur) && typeof seg === "number") {
      cur = cur[seg];
    } else if (typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[String(seg)];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function setAt(root: JsonValue, path: Path, value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  const next = cloneShallow(root);
  let cur: JsonValue = next;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    const child = cloneShallow((cur as Record<string, unknown>)[String(seg)] as JsonValue);
    (cur as Record<string, unknown>)[String(seg)] = child;
    cur = child;
  }
  const lastSeg = path[path.length - 1];
  (cur as Record<string, unknown>)[String(lastSeg)] = value;
  return next;
}

export function deleteAt(root: JsonValue, path: Path): JsonValue {
  if (path.length === 0) return root;
  const next = cloneShallow(root);
  let cur: JsonValue = next;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    const child = cloneShallow((cur as Record<string, unknown>)[String(seg)] as JsonValue);
    (cur as Record<string, unknown>)[String(seg)] = child;
    cur = child;
  }
  const lastSeg = path[path.length - 1];
  if (Array.isArray(cur) && typeof lastSeg === "number") {
    (cur as unknown[]).splice(lastSeg, 1);
  } else {
    delete (cur as Record<string, unknown>)[String(lastSeg)];
  }
  return next;
}

export function renameKey(
  root: JsonValue,
  parentPath: Path,
  oldKey: string,
  newKey: string,
): JsonValue {
  if (oldKey === newKey) return root;
  const parent = getAt(root, parentPath);
  if (!parent || typeof parent !== "object" || Array.isArray(parent)) return root;
  const entries = Object.entries(parent as Record<string, JsonValue>);
  const renamed: Record<string, JsonValue> = {};
  for (const [k, v] of entries) {
    renamed[k === oldKey ? newKey : k] = v;
  }
  return setAt(root, parentPath, renamed);
}

export function insertIntoArray(
  root: JsonValue,
  arrayPath: Path,
  index: number,
  value: JsonValue,
): JsonValue {
  const arr = getAt(root, arrayPath);
  if (!Array.isArray(arr)) return root;
  const next = [...arr];
  next.splice(index, 0, value);
  return setAt(root, arrayPath, next as JsonValue);
}

export function appendToArray(root: JsonValue, arrayPath: Path, value: JsonValue): JsonValue {
  const arr = getAt(root, arrayPath);
  if (!Array.isArray(arr)) return root;
  return setAt(root, arrayPath, [...arr, value] as JsonValue);
}

export function addToObject(
  root: JsonValue,
  objectPath: Path,
  key: string,
  value: JsonValue,
): JsonValue {
  const obj = getAt(root, objectPath);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return root;
  const next = { ...(obj as Record<string, JsonValue>), [key]: value };
  return setAt(root, objectPath, next);
}

export function duplicateAt(root: JsonValue, path: Path): JsonValue {
  if (path.length === 0) return root;
  const parentPath = path.slice(0, -1);
  const lastSeg = path[path.length - 1];
  const parent = getAt(root, parentPath);
  const value = getAt(root, path) as JsonValue;
  const cloned = structuredClone(value);
  if (Array.isArray(parent) && typeof lastSeg === "number") {
    return insertIntoArray(root, parentPath, lastSeg + 1, cloned);
  }
  if (parent && typeof parent === "object") {
    const newKey = findUniqueKey(parent as Record<string, unknown>, String(lastSeg));
    return addToObject(root, parentPath, newKey, cloned);
  }
  return root;
}

function findUniqueKey(obj: Record<string, unknown>, base: string): string {
  if (!(base in obj)) return base;
  let i = 2;
  while (`${base}_copy${i === 2 ? "" : i}` in obj) i++;
  return `${base}_copy${i === 2 ? "" : i}`;
}

export function defaultValueFor(type: JsonType): JsonValue {
  switch (type) {
    case "string": return "";
    case "number": return 0;
    case "boolean": return false;
    case "null": return null;
    case "object": return {};
    case "array": return [];
  }
}

export function coerceType(value: JsonValue, target: JsonType): JsonValue {
  switch (target) {
    case "string":
      if (value === null) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    case "number": {
      if (typeof value === "number") return value;
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }
    case "boolean":
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value === "true" || value === "1";
      if (typeof value === "number") return value !== 0;
      return false;
    case "null":
      return null;
    case "object":
      if (value && typeof value === "object" && !Array.isArray(value)) return value;
      return {};
    case "array":
      if (Array.isArray(value)) return value;
      return [];
  }
}

/** Smart format: inline short arrays/objects, expand long ones. */
export function smartFormat(value: JsonValue, maxInlineWidth = 80, indent = 2): string {
  function render(v: JsonValue, depth: number): string {
    const pad = " ".repeat(depth * indent);
    const innerPad = " ".repeat((depth + 1) * indent);
    if (v === null || typeof v !== "object") return JSON.stringify(v);

    const inline = JSON.stringify(v);
    if (inline.length + depth * indent <= maxInlineWidth) return inline;

    if (Array.isArray(v)) {
      if (v.length === 0) return "[]";
      const parts = v.map((item) => innerPad + render(item, depth + 1));
      return "[\n" + parts.join(",\n") + "\n" + pad + "]";
    }
    const entries = Object.entries(v);
    if (entries.length === 0) return "{}";
    const parts = entries.map(([k, val]) => innerPad + JSON.stringify(k) + ": " + render(val, depth + 1));
    return "{\n" + parts.join(",\n") + "\n" + pad + "}";
  }
  return render(value, 0);
}

