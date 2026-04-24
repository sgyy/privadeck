"use client";

export function ExifFieldRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="truncate font-mono text-sm text-foreground" title={value}>
        {value}
      </div>
    </div>
  );
}
