export const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;

export function sanitizePhoneInput(raw: string): string {
  const hasLeadingPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return hasLeadingPlus ? `+${digits}` : digits;
}
