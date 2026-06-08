
// Consumed by ResetPasswordPage after the user clicks the link in the forgot-password email.
export default interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}
