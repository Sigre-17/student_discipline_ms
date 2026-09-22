export function isValidIncidentDate(value) {
  if (!value) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

export function isRequiredText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
