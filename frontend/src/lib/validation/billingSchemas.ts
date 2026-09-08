import { z } from 'zod';

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export const cardPaymentSchema = z.object({
  cardholderName: z.string().trim().min(2, 'Cardholder name is required'),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .refine((v) => /^\d{13,19}$/.test(v), 'Enter a valid card number')
    .refine(luhnValid, 'Card number is invalid'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format')
    .refine((v) => {
      const [mm, yy] = v.split('/').map(Number);
      // Card is valid through the end of its expiry month.
      const expiresAt = new Date(2000 + yy, mm, 1);
      return expiresAt.getTime() > Date.now();
    }, 'Card has expired'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Enter a valid CVV'),
});
export type CardPaymentFormValues = z.infer<typeof cardPaymentSchema>;

export function cardBrand(digits: string): string {
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Card';
}

export const upiPaymentSchema = z.object({
  transactionRef: z.string().trim().min(6, 'Enter the UPI transaction / UTR number').max(100),
});
export type UpiPaymentFormValues = z.infer<typeof upiPaymentSchema>;
