// Very naive translator stub. Replace with real API.
export async function translate(input, lang='zh') {
  if (Array.isArray(input)) {
    return input.map(x => x) // keep headers as-is for MVP, you can map to translated labels here
  }
  if (typeof input === 'string') {
    return input // return original text for MVP (hook real translation here)
  }
  return input
}
