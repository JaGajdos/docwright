/**
 * Loading UX for Generate CTA (doc/08, doc/10 §7).
 */
export function setGenerateLoading(
  submit: { disabled: boolean },
  status: { hidden: boolean; textContent: string },
  loading: boolean,
  message = "Generating docs…",
  loader?: { hidden: boolean } | null,
): void {
  submit.disabled = loading;
  if (loader) loader.hidden = !loading;
  if (loading) {
    status.hidden = false;
    status.textContent = message;
  } else if (loader) {
    status.hidden = true;
  }
}
