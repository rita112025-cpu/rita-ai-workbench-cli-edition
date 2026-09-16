/**
 * Command parser — deterministic tokenizer.
 * ==================================================================
 * Rules:
 *   - Leading/trailing whitespace trimmed.
 *   - Tokens split on whitespace, EXCEPT inside double or single quotes.
 *   - Empty input => null command (no-op).
 *   - Quotes are stripped from the token value; embedded quotes are kept
 *     literally (no escape sequences beyond the basic cases).
 *   - Excessive whitespace collapsed: "a    b" -> ["a","b"].
 *
 * This guarantees "  ls    -la  " and "ls -la" parse identically, and
 * quoted inputs like `cat "my file.md"` are handled deterministically.
 */

export interface ParsedCommand {
  name: string;
  args: string[];
  raw: string;
}

export function parseCommand(input: string): ParsedCommand | null {
  if (input == null) return null;
  const raw = input;
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const tokens: string[] = [];
  let i = 0;
  let current = "";
  let inDouble = false;
  let inSingle = false;
  let hasToken = false;

  while (i < trimmed.length) {
    const ch = trimmed[i];
    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        current += ch;
        hasToken = true;
      }
    } else if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else {
        current += ch;
        hasToken = true;
      }
    } else {
      if (ch === '"' ) {
        inDouble = true;
        hasToken = true; // empty quoted string still counts as a token
      } else if (ch === "'") {
        inSingle = true;
        hasToken = true;
      } else if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        if (hasToken) {
          tokens.push(current);
          current = "";
          hasToken = false;
        }
      } else {
        current += ch;
        hasToken = true;
      }
    }
    i++;
  }
  if (hasToken) tokens.push(current);

  if (tokens.length === 0) return null;
  const [name, ...args] = tokens;
  return { name, args, raw };
}
