"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import {
  buildBingMapsUrl,
  buildGoogleMapsUrl,
  buildOsmUrl,
  formatAltitude,
  formatGpsDecimal,
  formatGpsDms,
} from "../logic/formatters";
import type { GpsCoords } from "../types";

export function GpsCoordDisplay({ gps }: { gps: GpsCoords }) {
  const t = useTranslations("tools.image.exif-editor");
  const { latitude, longitude, altitude } = gps;
  const tooltip = t("actions.openInMapTooltip");
  const mapLinks: Array<{ label: string; href: string }> = [
    { label: "OpenStreetMap", href: buildOsmUrl(latitude, longitude) },
    { label: "Google Maps", href: buildGoogleMapsUrl(latitude, longitude) },
    { label: "Bing Maps", href: buildBingMapsUrl(latitude, longitude) },
  ];
  return (
    <div className="space-y-3">
      <div className="grid gap-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">{t("fields.latitude")}:</span>
          <span className="font-mono">{formatGpsDms(latitude, "lat")}</span>
          <span className="text-muted-foreground">({latitude.toFixed(6)})</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">{t("fields.longitude")}:</span>
          <span className="font-mono">{formatGpsDms(longitude, "lon")}</span>
          <span className="text-muted-foreground">({longitude.toFixed(6)})</span>
        </div>
        {altitude !== undefined && Number.isFinite(altitude) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{t("fields.altitude")}:</span>
            <span className="font-mono">{formatAltitude(altitude)}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {formatGpsDecimal(latitude, longitude)}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {mapLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={tooltip}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
