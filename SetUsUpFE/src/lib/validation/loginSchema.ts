import { z } from 'zod';


export const passwordRequirements = [
  { label: 'lowercase letter (a–z)', test: /[a-z]/ },
  { label: 'uppercase letter (A–Z)', test: /[A-Z]/ },
  { label: 'digit (0–9)', test: /\d/ },
  { label: 'symbol (!@#$...)', test: /[^A-Za-z0-9]/ },
  { label: 'minimum 6 characters', test: /.{6,}/ }
];

/* shared password validation rules */
const passwordSchema = z.string()
  .min(6, '>=6 characters')
  .regex(passwordRequirements[0].test, passwordRequirements[0].label.split(' ').slice(0,2).join(' '))
  .regex(passwordRequirements[1].test, passwordRequirements[1].label.split(' ').slice(0,2).join(' '))
  .regex(passwordRequirements[2].test, passwordRequirements[2].label.split(' ').slice(0,1).join(' '))
  .regex(passwordRequirements[3].test, passwordRequirements[3].label.split(' ').slice(0,1).join(' '));

/* account validation message constants */
export const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.';
export const TOO_SHORT_USERNAME_MESSAGE = 'Username must be at least 3 characters long.';
export const TOO_LONG_USERNAME_MESSAGE = 'Username cannot be longer than 30 characters.';
export const EMPTY_PASSWORD_MESSAGE = 'Please enter your password.';

/* schema for email-based login */
export const loginWithEmailSchema = z.object({
  account: z.email(INVALID_EMAIL_MESSAGE).max(254, INVALID_EMAIL_MESSAGE),
  password: passwordSchema
});

/* schema for username-based login */
export const loginWithUsernameSchema = z.object({
  account: z.string()
    .min(3, TOO_SHORT_USERNAME_MESSAGE)
    .max(30, TOO_LONG_USERNAME_MESSAGE),
  password: passwordSchema
});

/* schema for validing all (3) user properties */
export const fullUserSchema = z.object({
  email: z.email(INVALID_EMAIL_MESSAGE).max(254, INVALID_EMAIL_MESSAGE),
  username: z.string()
    .min(3, TOO_SHORT_USERNAME_MESSAGE)
    .max(30, TOO_LONG_USERNAME_MESSAGE),
  password: passwordSchema
});

/* type exports for TS inference */
export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
export type LoginWithUsernameInput = z.infer<typeof loginWithUsernameSchema>;
