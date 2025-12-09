export function getInitials(email: string): string {
  const name = email.split('@')[0] ?? email;
  return name.charAt(0).toUpperCase();
}
