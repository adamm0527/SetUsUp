
// Step 1 of the email-change flow.
// On success, the BE sends a confirmation email to newEmail
// The change applies only when the user clicks the link in that email.
export default interface UpdateUserEmailRequest {
  newEmail: string;
}
