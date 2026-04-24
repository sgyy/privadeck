"use client";

import { useTranslations } from "next-intl";
import { MapPinOff, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExifFieldGroup } from "./ExifFieldGroup";
import { ExifFieldRow } from "./ExifFieldRow";
import { GpsCoordDisplay } from "./GpsCoordDisplay";
import { ReadOnlyFormatNotice } from "./ReadOnlyFormatNotice";
import {
  formatExposureTime,
  formatFNumber,
  formatFocalLength,
  formatIso,
} from "../logic/formatters";
import type { EditableFields, ExifRecord } from "../types";

interface Props {
  record: ExifRecord;
  edits: EditableFields;
  onEditsChange: (next: EditableFields) => void;
  onClearGps: () => void;
  onClearDateTime: () => void;
  processing: boolean;
}

export function ExifPanel({
  record,
  edits,
  onEditsChange,
  onClearGps,
  onClearDateTime,
  processing,
}: Props) {
  const t = useTranslations("tools.image.exif-editor");
  const n = record.normalized;
  const writable = record.writeable;
  const disabled = processing || !writable;

  function patch<K extends keyof EditableFields>(key: K, value: string) {
    onEditsChange({ ...edits, [key]: value });
  }

  const hasTechnical =
    n.iso !== undefined ||
    n.fNumber !== undefined ||
    n.exposureTime !== undefined ||
    !!n.flash ||
    !!n.whiteBalance ||
    n.orientation !== undefined ||
    !!n.colorSpace ||
    n.imageWidth !== undefined;

  const hasCameraInfo = n.make || n.software;

  return (
    <div className="space-y-3">
      {!writable && <ReadOnlyFormatNotice mime={record.mimeType} />}

      <div className="grid gap-3 md:grid-cols-2">
        <ExifFieldGroup title={t("groups.datetime")}>
          <div className="flex flex-wrap items-end gap-2">
            <Field label={t("fields.dateTimeOriginal")} className="min-w-[14rem] grow">
              <input
                type="datetime-local"
                value={edits.dateTimeOriginal}
                onChange={(e) => patch("dateTimeOriginal", e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </Field>
            {writable && edits.dateTimeOriginal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearDateTime}
                disabled={processing}
              >
                <CalendarOff className="h-3.5 w-3.5" />
                {t("actions.clearDateTime")}
              </Button>
            )}
          </div>
        </ExifFieldGroup>

        <ExifFieldGroup title={t("groups.gps")}>
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <Field label={t("fields.latitude")} className="w-32">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="39.904989"
                  value={edits.gpsLatitude}
                  onChange={(e) => patch("gpsLatitude", e.target.value)}
                  className={inputClass}
                  disabled={disabled}
                />
              </Field>
              <Field label={t("fields.longitude")} className="w-32">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="116.405285"
                  value={edits.gpsLongitude}
                  onChange={(e) => patch("gpsLongitude", e.target.value)}
                  className={inputClass}
                  disabled={disabled}
                />
              </Field>
              {writable && (edits.gpsLatitude || edits.gpsLongitude) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearGps}
                  disabled={processing}
                >
                  <MapPinOff className="h-3.5 w-3.5" />
                  {t("actions.clearGps")}
                </Button>
              )}
            </div>
            {n.gps && <GpsCoordDisplay gps={n.gps} />}
          </div>
        </ExifFieldGroup>

        <ExifFieldGroup title={t("groups.camera")}>
          <div className="space-y-3">
            <Field label={t("fields.model")}>
              <input
                type="text"
                value={edits.cameraModel}
                onChange={(e) => patch("cameraModel", e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </Field>
            <Field label={t("fields.lensModel")}>
              <input
                type="text"
                value={edits.lensModel}
                onChange={(e) => patch("lensModel", e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </Field>
            {hasCameraInfo && (
              <div className="grid gap-x-4 gap-y-2 border-t border-border/50 pt-3 sm:grid-cols-2">
                <ExifFieldRow label={t("fields.make")} value={n.make ?? ""} />
                <ExifFieldRow
                  label={t("fields.software")}
                  value={n.software ?? ""}
                />
              </div>
            )}
          </div>
        </ExifFieldGroup>

        <ExifFieldGroup title={t("groups.copyright")}>
          <div className="space-y-3">
            <Field label={t("fields.artist")}>
              <input
                type="text"
                value={edits.artist}
                onChange={(e) => patch("artist", e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </Field>
            <Field label={t("fields.copyright")}>
              <input
                type="text"
                value={edits.copyright}
                onChange={(e) => patch("copyright", e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </Field>
          </div>
        </ExifFieldGroup>
      </div>

      <ExifFieldGroup title={t("groups.iptc")}>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
          <Field label={t("fields.title")}>
            <input
              type="text"
              value={edits.title}
              onChange={(e) => patch("title", e.target.value)}
              className={inputClass}
              disabled={disabled}
            />
          </Field>
          <Field label={t("fields.description")}>
            <textarea
              rows={2}
              value={edits.description}
              onChange={(e) => patch("description", e.target.value)}
              className={`${inputClass} resize-y`}
              disabled={disabled}
            />
          </Field>
        </div>
      </ExifFieldGroup>

      {hasTechnical && (
        <ExifFieldGroup title={t("groups.technical")} defaultOpen={false}>
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <ExifFieldRow label={t("fields.iso")} value={formatIso(n.iso)} />
            <ExifFieldRow
              label={t("fields.fNumber")}
              value={formatFNumber(n.fNumber)}
            />
            <ExifFieldRow
              label={t("fields.exposureTime")}
              value={formatExposureTime(n.exposureTime)}
            />
            <ExifFieldRow
              label={t("fields.focalLength")}
              value={formatFocalLength(n.focalLength)}
            />
            <ExifFieldRow label={t("fields.flash")} value={n.flash ?? ""} />
            <ExifFieldRow
              label={t("fields.whiteBalance")}
              value={n.whiteBalance ?? ""}
            />
            <ExifFieldRow
              label={t("fields.orientation")}
              value={n.orientation !== undefined ? String(n.orientation) : ""}
            />
            <ExifFieldRow
              label={t("fields.colorSpace")}
              value={n.colorSpace ?? ""}
            />
            <ExifFieldRow
              label={t("fields.imageWidth")}
              value={n.imageWidth !== undefined ? `${n.imageWidth}px` : ""}
            />
            <ExifFieldRow
              label={t("fields.imageHeight")}
              value={n.imageHeight !== undefined ? `${n.imageHeight}px` : ""}
            />
          </div>
        </ExifFieldGroup>
      )}
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid min-w-0 gap-1 ${className}`}>
      <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60";
