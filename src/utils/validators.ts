export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s\-+()]{10,}$/.test(phone);
}

export function validateRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function validateMin(value: number, min: number): boolean {
  return value >= min;
}

export function validateMax(value: number, max: number): boolean {
  return value <= max;
}

export function validatePattern(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function validateCreditCard(card: string): boolean {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}
