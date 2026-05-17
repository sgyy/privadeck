"use client";

import { WatermarkCanvas } from "../components/WatermarkCanvas";
import { PresetBar } from "../components/PresetBar";
import { TextWatermarkControls } from "../components/TextWatermarkControls";
import { TilingControls } from "../components/TilingControls";
import { OutputControls } from "../components/OutputControls";
import { ApplyBar } from "../components/ApplyBar";

export function TextTab() {
  return (
    <div className="space-y-4">
      <WatermarkCanvas />
      <PresetBar />
      <TextWatermarkControls />
      <TilingControls />
      <OutputControls />
      <ApplyBar />
    </div>
  );
}
