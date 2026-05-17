"use client";

import { WatermarkCanvas } from "../components/WatermarkCanvas";
import { PresetBar } from "../components/PresetBar";
import { ImageWatermarkControls } from "../components/ImageWatermarkControls";
import { TilingControls } from "../components/TilingControls";
import { OutputControls } from "../components/OutputControls";
import { ApplyBar } from "../components/ApplyBar";

export function ImageTab() {
  return (
    <div className="space-y-4">
      <WatermarkCanvas />
      <PresetBar />
      <ImageWatermarkControls />
      <TilingControls />
      <OutputControls />
      <ApplyBar />
    </div>
  );
}
