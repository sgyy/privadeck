/**
 * Public façade for the add-text tool. Re-exports the pure processing
 * primitives so consumers (tests, future API) don't depend on UI internals.
 */
export { renderLayers } from "./lib/renderer";
export { exportImage, type ExportFormat, type ExportOptions } from "./lib/exporter";
export {
  createDefaultLayer,
  type TextLayer,
  type ImageSize,
  type Align,
  type BgMode,
  type FontWeight,
  type FontStyle,
} from "./lib/reducer";
