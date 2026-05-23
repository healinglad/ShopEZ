/**
 * Parses natural language input into actions.
 *
 * Capabilities:
 * 1. "Create list [Name]" -> { type: 'CREATE_LIST', name: '...' }
 * 2. "Buy [Item] and [Item]" -> { type: 'ADD_ITEMS', items: ['...', '...'] }
 */
export function parseCommand(transcript) {
    if (!transcript || typeof transcript !== 'string') {
        return { type: 'ADD_ITEMS', items: [] };
    }

    const lower = transcript.toLowerCase().trim();

    // Command: Create List
    if (lower.startsWith('create list') || lower.startsWith('new list')) {
        // Find where the keyword "list" ends and extract everything after it
        const listKeywordEnd = lower.indexOf('list') + 4;
        const listName = transcript.substring(listKeywordEnd).trim();
        if (listName) {
            return { type: 'CREATE_LIST', name: cleanName(listName) };
        }
    }

    // Command: Add Items (Default)
    // Remove one or more action-word prefixes: buy, add, get, i need, i want
    // Use a loop so "add buy milk" still works
    let cleanText = transcript.trim();
    const prefixPattern = /^(buy|add|get|i need|i want)\s+/i;
    while (prefixPattern.test(cleanText)) {
        cleanText = cleanText.replace(prefixPattern, '');
    }

    const items = cleanText
        .split(/,|\s+and\s+|\s+also\s+|\s+next\s+/i)
        .map(i => i.trim())
        .filter(i => i.length > 0 && i !== '.');

    return { type: 'ADD_ITEMS', items };
}

function cleanName(name) {
    // Remove leading/trailing punctuation
    return name.replace(/[^\w\s]/gi, '').trim();
}
