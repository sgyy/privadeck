import { useState, useEffect } from "react";

/**
 * Manages an Object URL lifecycle. Automatically revokes the previous URL
 * when the source changes and on unmount.
 */
export function useObjectUrl(source: Blob | File | null): string {
  const [url, setUrl] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!source) { setUrl(""); return; }
    const newUrl = URL.createObjectURL(source);
    setUrl(newUrl);
    return () => URL.revokeObjectURL(newUrl);
  }, [source]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return url;
}
