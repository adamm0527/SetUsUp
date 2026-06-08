
export default interface UpdateUserPasswordRequest {
  currentPassword: string; // required for re-authentication
  newPassword: string;
}
