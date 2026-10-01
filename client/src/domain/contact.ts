/** Message sent from the public "Contact us" form (docs/API.md §4.8). */
export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export interface ContactMessageReceipt {
  id: string;
  createdAt: string;
}
