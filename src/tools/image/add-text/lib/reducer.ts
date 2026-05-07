export type Align = "left" | "center" | "right";
export type BgMode = "none" | "full" | "line" | "word";
export type FontWeight = 400 | 500 | 600 | 700;
export type FontStyle = "normal" | "italic";

export interface TextLayer {
  id: string;
  text: string;
  xNorm: number;
  yNorm: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  fontSizePx: number;
  align: Align;
  letterSpacing: number;
  lineHeight: number;
  wrapWidthNorm: number | null;
  color: string;
  opacity: number;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  bgMode: BgMode;
  bgColor: string;
  bgOpacity: number;
  bgPaddingX: number;
  bgPaddingY: number;
  bgRadius: number;
  rotationDeg: number;
  locked: boolean;
  visible: boolean;
}

export interface ImageSize {
  w: number;
  h: number;
}

export interface EditorState {
  layers: TextLayer[];
  selectedLayerId: string | null;
  imageNaturalSize: ImageSize | null;
  imageBitmap: ImageBitmap | null;
  history: { past: TextLayer[][]; future: TextLayer[][] };
}

export const HISTORY_LIMIT = 50;

export const initialState: EditorState = {
  layers: [],
  selectedLayerId: null,
  imageNaturalSize: null,
  imageBitmap: null,
  history: { past: [], future: [] },
};

export function createDefaultLayer(overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `layer-${Date.now()}-${Math.random()}`,
    text: "Your text",
    xNorm: 0.5,
    yNorm: 0.5,
    fontFamily: "system-ui",
    fontWeight: 700,
    fontStyle: "normal",
    fontSizePx: 64,
    align: "center",
    letterSpacing: 0,
    lineHeight: 1.2,
    wrapWidthNorm: null,
    color: "#ffffff",
    opacity: 1,
    strokeColor: "#000000",
    strokeWidth: 0,
    shadowEnabled: false,
    shadowColor: "#000000",
    shadowBlur: 8,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    bgMode: "none",
    bgColor: "#000000",
    bgOpacity: 0.5,
    bgPaddingX: 12,
    bgPaddingY: 6,
    bgRadius: 4,
    rotationDeg: 0,
    locked: false,
    visible: true,
    ...overrides,
  };
}

export type Action =
  | { type: "SET_IMAGE"; payload: { bitmap: ImageBitmap; naturalSize: ImageSize } }
  | { type: "CLEAR_IMAGE" }
  | { type: "ADD_LAYER"; payload?: Partial<TextLayer> }
  | { type: "UPDATE_LAYER"; payload: { id: string; patch: Partial<TextLayer> } }
  | { type: "REMOVE_LAYER"; payload: { id: string } }
  | { type: "DUPLICATE_LAYER"; payload: { id: string } }
  | { type: "REORDER_LAYER"; payload: { id: string; direction: "up" | "down" } }
  | { type: "SELECT_LAYER"; payload: { id: string | null } }
  | { type: "COMMIT_HISTORY"; payload?: { snapshot?: TextLayer[] } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "APPLY_PRESET"; payload: { id: string; patch: Partial<TextLayer> } }
  | { type: "RESET" };

function pushHistory(state: EditorState, snapshot?: TextLayer[]): EditorState["history"] {
  const past = [...state.history.past, snapshot ?? state.layers].slice(-HISTORY_LIMIT);
  return { past, future: [] };
}

export function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_IMAGE":
      return {
        ...state,
        imageBitmap: action.payload.bitmap,
        imageNaturalSize: action.payload.naturalSize,
      };

    case "CLEAR_IMAGE":
      return {
        ...initialState,
      };

    case "ADD_LAYER": {
      const newLayer = createDefaultLayer(action.payload);
      const layers = [...state.layers, newLayer];
      return {
        ...state,
        layers,
        selectedLayerId: newLayer.id,
        history: pushHistory(state),
      };
    }

    case "UPDATE_LAYER": {
      const layers = state.layers.map((l) =>
        l.id === action.payload.id ? { ...l, ...action.payload.patch } : l,
      );
      return { ...state, layers };
    }

    case "REMOVE_LAYER": {
      // Skip if id no longer exists (e.g. user pressed Delete after an UNDO
      // already removed the selected layer). Avoids producing an empty,
      // idempotent history step.
      if (!state.layers.some((l) => l.id === action.payload.id)) {
        return state;
      }
      const layers = state.layers.filter((l) => l.id !== action.payload.id);
      return {
        ...state,
        layers,
        selectedLayerId:
          state.selectedLayerId === action.payload.id ? null : state.selectedLayerId,
        history: pushHistory(state),
      };
    }

    case "DUPLICATE_LAYER": {
      const source = state.layers.find((l) => l.id === action.payload.id);
      if (!source) return state;
      const copy = createDefaultLayer({
        ...source,
        xNorm: Math.min(0.95, source.xNorm + 0.03),
        yNorm: Math.min(0.95, source.yNorm + 0.03),
      });
      const layers = [...state.layers, copy];
      return {
        ...state,
        layers,
        selectedLayerId: copy.id,
        history: pushHistory(state),
      };
    }

    case "REORDER_LAYER": {
      const idx = state.layers.findIndex((l) => l.id === action.payload.id);
      if (idx === -1) return state;
      const target = action.payload.direction === "up" ? idx + 1 : idx - 1;
      if (target < 0 || target >= state.layers.length) return state;
      const layers = [...state.layers];
      [layers[idx], layers[target]] = [layers[target], layers[idx]];
      return { ...state, layers, history: pushHistory(state) };
    }

    case "SELECT_LAYER":
      return { ...state, selectedLayerId: action.payload.id };

    case "COMMIT_HISTORY":
      return { ...state, history: pushHistory(state, action.payload?.snapshot) };

    case "UNDO": {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const past = state.history.past.slice(0, -1);
      const future = [state.layers, ...state.history.future].slice(0, HISTORY_LIMIT);
      const selectedLayerId =
        state.selectedLayerId && previous.some((l) => l.id === state.selectedLayerId)
          ? state.selectedLayerId
          : null;
      return { ...state, layers: previous, selectedLayerId, history: { past, future } };
    }

    case "REDO": {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const future = state.history.future.slice(1);
      const past = [...state.history.past, state.layers].slice(-HISTORY_LIMIT);
      const selectedLayerId =
        state.selectedLayerId && next.some((l) => l.id === state.selectedLayerId)
          ? state.selectedLayerId
          : null;
      return { ...state, layers: next, selectedLayerId, history: { past, future } };
    }

    case "APPLY_PRESET": {
      // Skip if the target layer no longer exists (rapid undo + click race).
      // Same rationale as the REMOVE_LAYER guard: avoid an empty undo step.
      if (!state.layers.some((l) => l.id === action.payload.id)) {
        return state;
      }
      const layers = state.layers.map((l) =>
        l.id === action.payload.id ? { ...l, ...action.payload.patch } : l,
      );
      return { ...state, layers, history: pushHistory(state) };
    }

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}
