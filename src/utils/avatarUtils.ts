/**
 * Utility functions for avatar styling
 * Generates stable, unique colors for user avatars based on their ID
 */

/**
 * Simple hash function to convert a string to a number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Predefined color palette for avatars
 * Using vibrant, accessible colors that work well with white text
 */
const AVATAR_COLORS = [
  'bg-blue-600',      // Blue
  'bg-purple-600',    // Purple
  'bg-pink-600',      // Pink
  'bg-red-600',       // Red
  'bg-orange-600',    // Orange
  'bg-amber-600',     // Amber
  'bg-green-600',     // Green
  'bg-teal-600',      // Teal
  'bg-cyan-600',      // Cyan
  'bg-indigo-600',    // Indigo
  'bg-violet-600',    // Violet
  'bg-fuchsia-600',   // Fuchsia
] as const;

/**
 * Get a stable avatar color based on a user identifier
 * The same user ID will always return the same color
 *
 * @param userId - The user's unique identifier (uid, email, or displayName)
 * @returns Tailwind CSS class for background color
 */
export function getAvatarColor(userId: string): string {
  if (!userId) {
    return 'bg-blue-600'; // Default fallback
  }

  const hash = hashString(userId);
  const colorIndex = hash % AVATAR_COLORS.length;

  return AVATAR_COLORS[colorIndex];
}

/**
 * Get user initials for avatar fallback
 *
 * @param displayName - User's display name
 * @param email - User's email (fallback)
 * @returns 1-2 character initials
 */
export function getUserInitials(displayName: string | null, email: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      // First and last name initials
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // Single name initial
    return displayName.charAt(0).toUpperCase();
  }

  if (email) {
    return email.charAt(0).toUpperCase();
  }

  return 'U'; // Ultimate fallback
}
