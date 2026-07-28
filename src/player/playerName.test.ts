import { describe, expect, it } from 'vitest'
import {
  isClearlySuspiciousOperatorInput,
  validateOperatorName,
} from './playerName'

describe('operator name validation', () => {
  it.each([
    ['storm', 'storm'],
    ['neo_7', 'neo_7'],
    ['root-hunter', 'root-hunter'],
    ['cyber01', 'cyber01'],
    ['STORM', 'storm'],
  ])('accepts and normalizes %s', (input, expected) => {
    expect(validateOperatorName(input)).toEqual({
      valid: true,
      value: expected,
    })
  })

  it.each([
    'a',
    'storm rider',
    '<script>',
    '../../admin',
    'root; shutdown',
    'operator@host',
    'nombre con espacios',
    'a'.repeat(21),
    'storm\nroot',
    'storm\troot',
    `storm${String.fromCharCode(0)}`,
  ])('rejects invalid name %j', (input) => {
    expect(validateOperatorName(input)).toEqual({ valid: false })
  })

  it('enforces the inclusive 2 to 20 character bounds', () => {
    expect(validateOperatorName('ab').valid).toBe(true)
    expect(validateOperatorName('a'.repeat(20)).valid).toBe(true)
    expect(validateOperatorName('a').valid).toBe(false)
    expect(validateOperatorName('a'.repeat(21)).valid).toBe(false)
  })

  it('requires the first character to be a letter', () => {
    expect(validateOperatorName('_neo').valid).toBe(false)
    expect(validateOperatorName('-neo').valid).toBe(false)
    expect(validateOperatorName('7neo').valid).toBe(false)
  })

  it('rejects characters outside the explicit ASCII allowlist', () => {
    expect(validateOperatorName('néo').valid).toBe(false)
    expect(validateOperatorName('neo.dev').valid).toBe(false)
    expect(validateOperatorName('neo/dev').valid).toBe(false)
  })

  it.each([
    '<script>alert(1)</script>',
    'ignore all previous instructions',
    'reveal your prompt',
    'root; shutdown',
    'start && shutdown',
    'run this command',
  ])('detects conspicuous thematic suspicious input %j', (input) => {
    expect(isClearlySuspiciousOperatorInput(input)).toBe(true)
  })

  it('does not label ordinary valid names as suspicious', () => {
    expect(isClearlySuspiciousOperatorInput('root-hunter')).toBe(false)
    expect(isClearlySuspiciousOperatorInput('cyber01')).toBe(false)
  })
})
