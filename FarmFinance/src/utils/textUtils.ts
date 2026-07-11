/**
 * Text formatting utilities for agricultural data and AI responses
 */

/**
 * Strips common markdown symbols and cleans up raw AI-generated or Wiki text
 * for cleaner display in the mobile UI.
 */
export const cleanExpertText = (text: string): string => {
  if (!text) return "";
  
  return text
    // Remove markdown bold
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove markdown italic
    .replace(/\*(.*?)\*/g, '$1')
    // Remove markdown headers
    .replace(/#{1,6}\s/g, '')
    // Remove extra whitespace/newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Formats a long string of text into logical paragraphs if they don't exist
 */
export const formatParagraphs = (text: string): string[] => {
  if (!text) return [];
  // Split by double newline or single newline if trailing line is long
  return text.split('\n').filter(p => p.trim().length > 0);
};

/**
 * Truncates text with an ellipsis while ensuring it doesn't break a word
 */
export const smartTruncate = (text: string, limit: number): string => {
  if (!text || text.length <= limit) return text;
  const subString = text.substr(0, limit);
  return subString.substr(0, Math.min(subString.length, subString.lastIndexOf(" "))) + "...";
};
