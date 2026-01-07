import axios from 'axios';

/**
 * SearchTool provides a simple web search capability using DuckDuckGo's
 * instant-answer JSON API (no API key required). In production you may swap
 * this out for Google Custom Search, SerpAPI or any other provider.
 */
export class SearchTool {
    /**
     * Perform a web search and return a short text snippet containing the
     * abstract and URL of the top result. If no answer is found an empty string
     * is returned.
     * @param query The search query
     */
    static async search(query: string): Promise<string> {
        if (!query) return '';

        const endpoint = 'https://api.duckduckgo.com/';
        try {
            const { data } = await axios.get(endpoint, {
                params: {
                    q: query,
                    format: 'json',
                    no_redirect: 1,
                    no_html: 1,
                },
            });

            if (data?.AbstractURL && data?.AbstractText) {
                return `${data.AbstractText}\nSource: ${data.AbstractURL}`;
            }
            if (Array.isArray(data?.RelatedTopics) && data.RelatedTopics.length > 0) {
                const topic = data.RelatedTopics[0];
                if (topic?.Text && topic?.FirstURL) {
                    return `${topic.Text}\nSource: ${topic.FirstURL}`;
                }
            }
            return 'No relevant search results found.';
        } catch (err) {
            console.error('SearchTool.search error', err);
            return 'Web search failed.';
        }
    }

    /**
     * Heuristic to decide if a model answer indicates uncertainty and therefore
     * warrants a web search.
     */
    static shouldSearch(content: string): boolean {
        if (!content) return false;
        const patterns = [
            "i'm not sure",
            'i am not sure',
            "i don't know",
            'unable to',
            'no information',
            'not have that information',
        ];
        const lowered = content.toLowerCase();
        return patterns.some((p) => lowered.includes(p));
    }
}
