const OPERATOR_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{1,19}$/

const SUSPICIOUS_INPUT_PATTERNS = [
  /\bignore\s+(?:all|previous)\s+instructions\b/i,
  /\bsystem\s+prompt\b/i,
  /\bdeveloper\s+message\b/i,
  /\breveal\s+(?:your|the)\s+prompt\b/i,
  /\bjailbreak\b/i,
  /\b(?:execute|run)\s+(?:this\s+)?command\b/i,
  /<\s*script\b/i,
  /&&|\|\||;|`|\$\(/,
]

export type OperatorNameValidation =
  | {
      valid: true
      value: string
    }
  | {
      valid: false
    }

/**
 * Validates and normalizes an operator name without depending on React.
 *
 * Control characters are rejected before trimming so tabs and line breaks
 * cannot disappear during normalization. Accepted names are safe, short ASCII
 * identifiers, but React must still render them as text rather than HTML.
 */
export function validateOperatorName(input: string): OperatorNameValidation {
  const containsControlCharacter = Array.from(input).some((character) => {
    const characterCode = character.charCodeAt(0)
    return characterCode <= 31 || characterCode === 127
  })

  if (containsControlCharacter) {
    return { valid: false }
  }

  const normalizedName = input.trim().toLowerCase()

  if (!OPERATOR_NAME_PATTERN.test(normalizedName)) {
    return { valid: false }
  }

  return {
    valid: true,
    value: normalizedName,
  }
}

/**
 * Adds a small thematic response for conspicuous injection-like input.
 *
 * This is intentionally conservative and is not the security boundary. The
 * strict name allowlist, command registry and text-only rendering provide the
 * actual safety guarantees.
 */
export function isClearlySuspiciousOperatorInput(input: string): boolean {
  return SUSPICIOUS_INPUT_PATTERNS.some((pattern) => pattern.test(input))
}
