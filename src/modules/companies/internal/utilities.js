/**
 * Safely converts an ID to a string to preserve precision for large numbers
 * @param {number|string|bigint} id - The ID to convert to string
 * @returns {string} The string representation of the ID
 */
export function safeStringId(id) {
  if (id === null || id === undefined) return null;
  return String(id);
}

/**
 * Ensures an array of IDs are all properly converted to strings
 * @param {Array<number|string|bigint>} ids - Array of IDs
 * @returns {Array<string>} Array of string IDs
 */
export function safeStringIds(ids) {
  if (!Array.isArray(ids)) return [];
  return ids.map(id => safeStringId(id));
}