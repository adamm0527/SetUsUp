
// The BE looks up the user by email and sends a reset link.
export default interface ForgotPasswordRequest {
  email: string;
}
