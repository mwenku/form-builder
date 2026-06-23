export type UserErrorCode =
  | "network"
  | "not_found"
  | "load_failed"
  | "submit_failed"
  | "server_error";

export const userMessages: Record<UserErrorCode, string> = {
  network: "We couldn't reach the server. Check your connection and try again.",
  not_found: "This form isn't available or may have been removed.",
  load_failed: "We couldn't load this content. Please try again.",
  submit_failed: "We couldn't save your response. Please try again.",
  server_error: "Something went wrong on our end. Please try again later.",
};

export const userMessagesStatic = {
  submitSuccess: "Thank you, your response has been recorded.",
  validationSummary: "Please correct the highlighted fields before submitting.",
  emptyForms: "No forms are available right now. Please check back later.",
  formListIntro: "Choose a form below to get started.",
  integrityIntro:
    "Responses stay linked to the form version that was active when they were submitted.",
};
