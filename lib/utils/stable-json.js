// Generate stable JSON string with sorted keys
export function stableStringify(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}