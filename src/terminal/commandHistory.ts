export const MAX_COMMAND_HISTORY = 100

export interface HistoryNavigationResult {
  index: number | null
  value: string
}

/**
 * Retains a bounded list of normalized commands for keyboard navigation.
 */
export function appendCommandHistory(
  history: readonly string[],
  command: string,
): string[] {
  return [...history, command].slice(-MAX_COMMAND_HISTORY)
}

export function getPreviousHistoryEntry(
  history: readonly string[],
  currentIndex: number | null,
): HistoryNavigationResult | null {
  if (history.length === 0) {
    return null
  }

  const index =
    currentIndex === null
      ? history.length - 1
      : Math.max(0, currentIndex - 1)

  return { index, value: history[index] }
}

export function getNextHistoryEntry(
  history: readonly string[],
  currentIndex: number | null,
  draft: string,
): HistoryNavigationResult | null {
  if (currentIndex === null || history.length === 0) {
    return null
  }

  if (currentIndex < history.length - 1) {
    const index = currentIndex + 1
    return { index, value: history[index] }
  }

  return { index: null, value: draft }
}
