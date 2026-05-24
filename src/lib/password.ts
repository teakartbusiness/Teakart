/**
 * Password rules — must match what Supabase Auth enforces server-side so the
 * client-side validation matches the actual API rejection behavior.
 *
 * Current Supabase project settings (set May 2026):
 *   - Minimum length: 10
 *   - Required character classes: lowercase, uppercase, digits, symbols
 *   - Leaked-password protection: ON (cross-checked against HIBP)
 */
export const PASSWORD_RULES = {
  minLength: 10,
  requireLowercase: true,
  requireUppercase: true,
  requireDigit: true,
  requireSymbol: true,
} as const

const RE_LOWER = /[a-z]/
const RE_UPPER = /[A-Z]/
const RE_DIGIT = /[0-9]/
// Anything not a letter or digit counts as a symbol. Matches Supabase's
// default "symbols" class (everything in the standard 7-bit printable
// set that isn't [a-zA-Z0-9]).
const RE_SYMBOL = /[^a-zA-Z0-9\s]/

/** Returns null if the password satisfies every rule, otherwise the first failure as a human message. */
export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_RULES.minLength) {
    return `Password must be at least ${PASSWORD_RULES.minLength} characters.`
  }
  if (PASSWORD_RULES.requireLowercase && !RE_LOWER.test(pw)) {
    return 'Password must include a lowercase letter.'
  }
  if (PASSWORD_RULES.requireUppercase && !RE_UPPER.test(pw)) {
    return 'Password must include an uppercase letter.'
  }
  if (PASSWORD_RULES.requireDigit && !RE_DIGIT.test(pw)) {
    return 'Password must include a digit.'
  }
  if (PASSWORD_RULES.requireSymbol && !RE_SYMBOL.test(pw)) {
    return 'Password must include a symbol.'
  }
  return null
}

/** Per-rule pass/fail breakdown — used by the live requirements checklist UI. */
export function passwordChecklist(pw: string) {
  return [
    { label: `At least ${PASSWORD_RULES.minLength} characters`, met: pw.length >= PASSWORD_RULES.minLength },
    { label: 'A lowercase letter (a–z)',                         met: RE_LOWER.test(pw) },
    { label: 'An uppercase letter (A–Z)',                        met: RE_UPPER.test(pw) },
    { label: 'A digit (0–9)',                                    met: RE_DIGIT.test(pw) },
    { label: 'A symbol (!, @, #, …)',                            met: RE_SYMBOL.test(pw) },
  ]
}

/**
 * Cryptographically random password generator.
 *
 * Guarantees one character from each required class, then fills the rest
 * from the union, then shuffles so the guaranteed chars aren't always at
 * the front. All randomness from crypto.getRandomValues — never Math.random.
 *
 * Lookalike characters (0/O/o, 1/l/I) are intentionally excluded so the
 * password is safer to read aloud or transcribe.
 */
export function generatePassword(length = 16): string {
  if (length < PASSWORD_RULES.minLength) length = PASSWORD_RULES.minLength

  const lower = 'abcdefghijkmnpqrstuvwxyz'   // skip l, o
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'   // skip I, O
  const digits = '23456789'                  // skip 0, 1
  const symbols = '!@#$%^&*-_+=?'

  const guaranteed = [
    pickChar(lower),
    pickChar(upper),
    pickChar(digits),
    pickChar(symbols),
  ]

  const all = lower + upper + digits + symbols
  const rest: string[] = []
  for (let i = guaranteed.length; i < length; i++) {
    rest.push(pickChar(all))
  }

  return shuffle([...guaranteed, ...rest]).join('')
}

function pickChar(set: string): string {
  return set[secureInt(set.length)]
}

function secureInt(max: number): number {
  // Rejection-sample to avoid modulo bias on small `max` values.
  const limit = Math.floor(0xffffffff / max) * max
  const buf = new Uint32Array(1)
  while (true) {
    crypto.getRandomValues(buf)
    if (buf[0] < limit) return buf[0] % max
  }
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
