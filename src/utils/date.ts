/**
 * Formats a date with short month, day, year, and time
 * Example: "Dec 8, 2024, 10:30 AM"
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date with full weekday, long month, day, year, and time
 * Example: "Monday, December 8, 2024, 10:30 AM"
 */
export function formatDateLong(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date as time if within 24 hours, otherwise as short date
 * Example: "10:30 AM" or "Dec 8"
 */
export function formatShortDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a date as time if within 24 hours, otherwise as locale date string
 * Example: "10:30 AM" or "12/8/2024"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const emailDate = new Date(date);
  const diffInHours = (now.getTime() - emailDate.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return emailDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return emailDate.toLocaleDateString();
}
