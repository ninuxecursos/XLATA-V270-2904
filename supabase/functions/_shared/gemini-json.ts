// Tolerant JSON parser for Gemini responses.
// Handles markdown fences, control chars, leading/trailing junk, and truncated output (MAX_TOKENS).
export function parseGeminiJson<T = any>(rawText: string): T {
  if (!rawText) throw new Error("Empty Gemini response");

  // Strip markdown fences and control chars (keep \n \r \t)
  let s = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .replace(/[\x00-\x1F\x7F]/g, (c) => (c === "\n" || c === "\r" || c === "\t" ? c : ""))
    .trim();

  // Handle unescaped newlines inside JSON strings which Gemini frequently does
  // We look for content between double quotes and replace literal newlines with \n
  s = s.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match) => {
    return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  });

  // First attempt: parse as-is
  try {
    return JSON.parse(s);
  } catch (_) { /* fall through */ }

  // Second: extract from first '{' to last '}'
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const candidate = s.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) { /* fall through */ }
  }

  // Third: auto-close on truncation. Walk the string, ignoring strings,
  // and append missing closers in correct order.
  const startIdx = first === -1 ? 0 : first;
  const work = s.slice(startIdx);
  const stack: string[] = [];
  let inStr = false;
  let escape = false;
  let lastValidEnd = -1;

  for (let i = 0; i < work.length; i++) {
    const ch = work[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inStr) { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;

    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") {
      if (stack[stack.length - 1] === ch) {
        stack.pop();
        if (stack.length === 0) lastValidEnd = i;
      }
    }
  }

  // If a truncated string at the end, drop everything after the last comma/closing token
  let truncated = work;
  if (inStr) {
    // Find last safe break: a comma or closer outside of a string.
    let depth = 0;
    let inStr2 = false;
    let esc2 = false;
    let lastSafe = -1;
    for (let i = 0; i < work.length; i++) {
      const ch = work[i];
      if (esc2) { esc2 = false; continue; }
      if (ch === "\\" && inStr2) { esc2 = true; continue; }
      if (ch === '"') { inStr2 = !inStr2; continue; }
      if (inStr2) continue;
      if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") depth--;
      else if (ch === "," && depth > 0) lastSafe = i;
    }
    if (lastSafe > 0) truncated = work.slice(0, lastSafe);
  } else if (lastValidEnd >= 0) {
    // Already balanced at lastValidEnd — try that slice
    try {
      return JSON.parse(work.slice(0, lastValidEnd + 1));
    } catch (_) { /* fall through */ }
  }

  // Recompute remaining open brackets after truncation
  const stack2: string[] = [];
  let inStr3 = false;
  let esc3 = false;
  for (let i = 0; i < truncated.length; i++) {
    const ch = truncated[i];
    if (esc3) { esc3 = false; continue; }
    if (ch === "\\" && inStr3) { esc3 = true; continue; }
    if (ch === '"') { inStr3 = !inStr3; continue; }
    if (inStr3) continue;
    if (ch === "{" || ch === "[") stack2.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") {
      if (stack2[stack2.length - 1] === ch) stack2.pop();
    }
  }

  // Append missing closers (in reverse)
  let closed = truncated;
  while (stack2.length) closed += stack2.pop();

  try {
    return JSON.parse(closed);
  } catch (e) {
    // Final attempt: fix common missing commas between properties
    try {
      const fixed = closed.replace(/("|\d|true|false|null)\s*\n\s*"/g, '$1,\n"');
      return JSON.parse(fixed);
    } catch (finalErr) {
      throw new Error(`Failed to parse Gemini JSON: ${(finalErr as Error).message}`);
    }
  }
}
