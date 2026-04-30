"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { parseJwt, type FormatOutput, type JwtTimestamps } from "../logic";

export function JwtTab({
  tz,
  token,
  onTokenChange,
}: {
  tz: string;
  token: string;
  onTokenChange: (t: string) => void;
}) {
  const t = useTranslations("tools.developer.timestamp");

  const result = useMemo<JwtTimestamps | null>(() => {
    if (!token.trim()) return null;
    return parseJwt(token, tz);
  }, [token, tz]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("jwtInputLabel")}</label>
        <textarea
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder={t("jwtInputPlaceholder")}
          rows={4}
          spellCheck={false}
          className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
        />
      </div>

      {result && !result.ok && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-medium">{t("invalidJwt")}</div>
            {result.error && <div className="mt-0.5 text-xs">{result.error}</div>}
          </div>
        </div>
      )}

      {result?.ok && (
        <>
          <StatusBadge result={result} />

          {result.iat == null && result.nbf == null && result.exp == null ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("jwtNoTimestamps")}
            </div>
          ) : (
            <div className="space-y-3">
              {result.iat != null && (
                <ClaimRow labelKey="jwtIat" raw={result.iat} fmt={result.iatFmt} />
              )}
              {result.nbf != null && (
                <ClaimRow labelKey="jwtNbf" raw={result.nbf} fmt={result.nbfFmt} />
              )}
              {result.exp != null && (
                <ClaimRow labelKey="jwtExp" raw={result.exp} fmt={result.expFmt} />
              )}
            </div>
          )}

          {result.payload && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t("jwtPayload")}</label>
                <CopyButton text={JSON.stringify(result.payload, null, 2)} />
              </div>
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
                <code>{JSON.stringify(result.payload, null, 2)}</code>
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ result }: { result: JwtTimestamps }) {
  const t = useTranslations("tools.developer.timestamp");
  if (result.expired) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {t("jwtExpired")}
      </div>
    );
  }
  if (result.notYetValid) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
        <Clock className="h-4 w-4" aria-hidden="true" />
        {t("jwtNotYetValid")}
      </div>
    );
  }
  if (result.exp != null) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {t("jwtValid")}
      </div>
    );
  }
  return null;
}

function ClaimRow({ labelKey, raw, fmt }: { labelKey: string; raw: number; fmt: FormatOutput | undefined }) {
  const t = useTranslations("tools.developer.timestamp");
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t(labelKey)}
          </div>
          <div className="font-mono text-sm">{raw}</div>
        </div>
        <CopyButton text={String(raw)} />
      </div>
      {fmt && (
        <div className="space-y-0.5 border-t border-border pt-2 font-mono text-xs">
          <div><span className="mr-2 text-muted-foreground">UTC</span>{fmt.utc}</div>
          <div><span className="mr-2 text-muted-foreground">Local</span>{fmt.local}</div>
          <div><span className="mr-2 text-muted-foreground">Rel</span>{fmt.relative}</div>
        </div>
      )}
    </div>
  );
}
