
export default interface UpdateUserInstagramRequest {
  instagramAccount: string | null; // null/empty clears the handle. BE strips a leading '@' before persisting.
}
