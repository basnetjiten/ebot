// Utility to clean JSON output
export function cleanJsonOutput(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];
    return text.replace(/```json\n?|\n?```/g, '').trim();
}
