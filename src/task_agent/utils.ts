// Utility to clean JSON output
export function cleanJsonOutput(text: string): string {
    // Try to find a JSON block wrapped in triple backticks first
    const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (blockMatch && blockMatch[1]) {
        return blockMatch[1].trim();
    }

    // Otherwise, find the first '{' and the last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1).trim();
    }

    // Fallback: strip markdown markers and trim
    return text.replace(/```json\n?|\n?```/g, '').trim();
}
