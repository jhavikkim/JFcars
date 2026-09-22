const localPartPattern = /^[a-z0-9.!#$'*+/=_`{|}~-]+$/i;
const domainLabelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

/** Conservative mailbox validation suitable for user-supplied contact links. */
export function isValidEmailAddress(value: string) {
  if (!value || value.length > 254 || /[\s?&#%]/.test(value)) return false;
  const separator = value.lastIndexOf('@');
  if (separator <= 0 || separator !== value.indexOf('@')) return false;
  const local = value.slice(0, separator);
  const domain = value.slice(separator + 1);
  if (
    local.length > 64 ||
    !localPartPattern.test(local) ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..')
  )
    return false;
  const labels = domain.split('.');
  return (
    labels.length >= 2 &&
    labels.every((label) => domainLabelPattern.test(label)) &&
    /^[a-z]{2,63}$/i.test(labels.at(-1) || '')
  );
}

/** Produces a mail link only after strict validation has rejected URI delimiters. */
export function mailtoHref(value: string) {
  return isValidEmailAddress(value) ? `mailto:${value}` : 'mailto:';
}

/** Keeps familiar display punctuation while rejecting dial-string commands. */
export function normalizePhoneNumber(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!/^\+?[0-9 ()-]+$/.test(normalized)) return '';
  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 20 ? normalized : '';
}

export function telHref(value: string) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return 'tel:';
  const digits = normalized.replace(/\D/g, '');
  return `tel:${normalized.startsWith('+') ? '+' : ''}${digits}`;
}
