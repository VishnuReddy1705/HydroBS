/**
 * Robust error message extractor for API exceptions and error responses.
 * Prevents [object Object] rendering inside JSX children or alert/toast dialogs.
 */
export const getErrorMessage = (err: any, defaultMsg: string = "An error occurred"): string => {
  if (!err) return defaultMsg;
  if (typeof err === "string") return err;

  // Handle Axios response error payloads
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      return data.message || data.error || data.errorMessage || JSON.stringify(data);
    }
  }

  // Handle standard Javascript error objects
  if (err.message) return err.message;

  // Final fallback
  try {
    return JSON.stringify(err);
  } catch {
    return defaultMsg;
  }
};
