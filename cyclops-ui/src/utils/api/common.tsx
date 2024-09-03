export function isStreamingEnabled() {
  return window.__RUNTIME_CONFIG__.REACT_APP_ENABLE_STREAMING === "true";
}
