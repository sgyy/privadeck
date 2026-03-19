"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/Button";
import { File as FileIcon, Folder, Download, Image, FileCode } from "lucide-react";
import {
  extractZip,
  downloadEntry,
  formatFileSize,
  getFileIcon,
  type ArchiveEntry,
} from "./logic";

export default function Archive() {
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("tools.developer.archive");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setEntries([]);
    setError("");
    setExtracting(true);

    try {
      const result = await extractZip(f);
      setEntries(result);
    } catch (e) {
      setError(t("unsupportedFormat"));
    } finally {
      setExtracting(false);
    }
  }

  function getIcon(entry: ArchiveEntry) {
    if (entry.isDirectory) return <Folder className="h-4 w-4 text-yellow-500" />;
    const type = getFileIcon(entry.path);
    if (type === "image") return <Image className="h-4 w-4 text-blue-500" />;
    if (type === "code") return <FileCode className="h-4 w-4 text-green-500" />;
    return <FileIcon className="h-4 w-4 text-muted-foreground" />;
  }

  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  const fileCount = entries.filter((e) => !e.isDirectory).length;

  return (
    <div className="space-y-4">
      <FileDropzone
        accept=".zip,.ZIP"
        onFiles={handleFile}
      />

      {extracting && (
        <div className="text-center text-sm text-muted-foreground">
          {t("extracting")}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {fileCount} {t("files")} · {formatFileSize(totalSize)}
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-muted/50"
                style={{
                  paddingLeft: `${(entry.path.split("/").length - 1) * 16 + 12}px`,
                }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {getIcon(entry)}
                  <span className="truncate">
                    {entry.path.split("/").filter(Boolean).pop()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!entry.isDirectory && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(entry.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadEntry(entry)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
