const keywordGroups = {
  grounding: ['anxious', 'anxiety', 'stressed', 'overwhelmed', 'panic', "can't sleep", 'tired', 'scared', 'worried', 'nervous', 'spiraling', 'racing'],
  conflict: ['fight', 'argued', 'argument', 'angry', 'mad', 'yelled', 'upset with', 'conflict', 'frustrated', 'blew up', 'tension'],
  microskills: ['friend', 'partner', 'roommate', 'family', 'lonely', 'communicate', 'talk to', 'misunderstood', 'relationship', 'boyfriend', 'girlfriend', 'coworker'],
}

const moodFallbacks = {
  red: ['grounding', 'conflict'],
  yellow: ['grounding', 'microskills'],
  green: ['microskills'],
}

export function recommendResources({ mood, text = '' }) {
  if (SHOW_ALL_RESOURCES_FOR_DEV) return ['grounding', 'conflict', 'microskills']

  const normalized = text.toLowerCase()
  const matches = Object.entries(keywordGroups)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([id]) => id)
  const ordered = matches.length ? matches : (moodFallbacks[mood] || moodFallbacks.yellow)
  const withRedSupport = mood === 'red' && matches.length ? ['grounding', ...ordered] : ordered
  return [...new Set(withRedSupport)].slice(0, 3)
}
export const SHOW_ALL_RESOURCES_FOR_DEV = true
