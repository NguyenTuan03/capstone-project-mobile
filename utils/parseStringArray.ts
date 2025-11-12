/**
 * Parse string format like {"item1","item2"} into an array ["item1", "item2"]
 * Used for specialties and teachingMethods that come back as strings from backend
 */
export function parseStringArray(data: string | string[] | null | undefined): string[] {
  if (!data) return [];
  
  // If already an array, return as is
  if (Array.isArray(data)) return data;
  
  // If it's a string in the format {"item1","item2",...}
  if (typeof data === "string") {
    // Remove curly braces and split by comma and quotes
    const cleaned = data
      .replace(/[{}]/g, "") // Remove { }
      .split(",") // Split by comma
      .map((item) => item.trim().replace(/"/g, "")) // Remove quotes and trim
      .filter((item) => item.length > 0); // Remove empty strings
    
    return cleaned;
  }
  
  return [];
}
