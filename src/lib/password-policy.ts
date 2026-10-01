// Password policy shared by the browser (live hints) and the server (enforcement).
// No server-only imports here.

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_RULES: { id: string; label: string; test: (p: string) => boolean }[] = [
  { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: p => p.length >= PASSWORD_MIN_LENGTH },
  { id: "upper", label: "An uppercase letter (A–Z)", test: p => /[A-Z]/.test(p) },
  { id: "lower", label: "A lowercase letter (a–z)", test: p => /[a-z]/.test(p) },
  { id: "number", label: "A number (0–9)", test: p => /[0-9]/.test(p) },
  { id: "special", label: "A special character (!@#$…)", test: p => /[^A-Za-z0-9]/.test(p) },
];

export function passwordProblems(password: string): string[] {
  const problems = PASSWORD_RULES.filter(r => !r.test(password)).map(r => r.label);
  if (password.length > PASSWORD_MAX_LENGTH) problems.push(`At most ${PASSWORD_MAX_LENGTH} characters`);
  return problems;
}

export function isStrongPassword(password: string) {
  return passwordProblems(password).length === 0;
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SPECIAL = "!@#$%^&*-_=+?";

function randomIndex(max: number) {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] % max;
}

// Cryptographically random password that always satisfies the policy
export function generateStrongPassword(length = 16) {
  const all = UPPER + LOWER + DIGITS + SPECIAL;
  const chars = [
    UPPER[randomIndex(UPPER.length)],
    LOWER[randomIndex(LOWER.length)],
    DIGITS[randomIndex(DIGITS.length)],
    SPECIAL[randomIndex(SPECIAL.length)],
  ];
  while (chars.length < length) chars.push(all[randomIndex(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
