export interface DiffLine {
  type: "equal" | "add" | "remove";
  text: string;
}

/**
 * Compute a line-based diff using the LCS (Longest Common Subsequence) algorithm.
 */
export function computeDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA === "" ? [] : textA.split("\n");
  const linesB = textB === "" ? [] : textB.split("\n");

  const m = linesA.length;
  const n = linesB.length;

  // Guard against excessive memory usage (m×n > 5M ≈ 40MB)
  if (m * n > 5_000_000) {
    throw new Error(`Input too large for diff (${m} × ${n} lines). Max ~2200 lines each.`);
  }

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      result.push({ type: "equal", text: linesA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "add", text: linesB[j - 1] });
      j--;
    } else {
      result.push({ type: "remove", text: linesA[i - 1] });
      i--;
    }
  }

  return result.reverse();
}

/**
 * Generate a unified diff string from DiffLine array.
 */
export function toUnifiedDiff(lines: DiffLine[]): string {
  return lines
    .map((line) => {
      switch (line.type) {
        case "add":
          return `+ ${line.text}`;
        case "remove":
          return `- ${line.text}`;
        default:
          return `  ${line.text}`;
      }
    })
    .join("\n");
}
