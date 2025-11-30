/**
 * Parse string format into an array
 * Supports multiple formats:
 * - JSON array: ["item1","item2"]
 * - Object format: {"item1","item2"}
 * - Comma-separated: item1, item2
 * Used for specialties and teachingMethods that come back as strings from backend
 */
export function parseStringArray(data: string | string[] | null | undefined): string[] {
  if (!data) return [];
  
  // If already an array, return as is
  if (Array.isArray(data)) return data;
  
  // If it's a string, parse it
  if (typeof data === "string") {
    const trimmed = data.trim();
    
    // Try to parse as JSON array first (e.g., ["item1","item2"])
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter((item) => item.length > 0);
        }
      } catch {
        // If JSON parsing fails, continue to other formats
      }
    }
    
    // Try object format {"item1","item2"}
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const cleaned = trimmed
        .replace(/[{}]/g, "") // Remove { }
        .split(",") // Split by comma
        .map((item) => item.trim().replace(/"/g, "")) // Remove quotes and trim
        .filter((item) => item.length > 0); // Remove empty strings
      return cleaned;
    }
    
    // Default: comma-separated format
    const cleaned = trimmed
      .split(",") // Split by comma
      .map((item) => item.trim()) // Trim whitespace
      .filter((item) => item.length > 0); // Remove empty strings
    
    return cleaned;
  }
  
  return [];
}
