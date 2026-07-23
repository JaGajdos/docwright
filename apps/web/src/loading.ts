/**
 * Loading UX for Generate CTA (doc/08, doc/10 §7).
 */
export function setGenerateLoading(
  submit: { disabled: boolean },
  status: { hidden: boolean; textContent: string },
  loading: boolean,
  message = "Generating docs… this can take up to a couple of minutes.",
): void {
  submit.disabled = loading;
  if (loading) {
    status.hidden = false;
    status.textContent = message;
  }
}
