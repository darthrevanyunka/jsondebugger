export function tryParseJSON(raw) {
  try {
    const parsed = JSON.parse(raw);
    return { data: parsed, error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

// Walk dot-notation path into an object, e.g. "data.orders" -> parsed.data.orders
export function resolvePath(obj, path) {
  if (!path.trim()) return { value: obj, error: null };
  const parts = path.trim().split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return { value: null, error: `"${part}" not found - parent is not an object` };
    }
    if (!(part in current)) {
      const available = Object.keys(current).join(", ");
      return { value: null, error: `Key "${part}" not found. Available: ${available}` };
    }
    current = current[part];
  }
  if (!Array.isArray(current)) {
    return { value: null, error: `Path resolves to a ${typeof current}, not an array` };
  }
  return { value: current, error: null };
}

export function tryFilter(data, expr) {
  if (!expr.trim()) return { result: data, error: null, count: data.length };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("item", "index", `"use strict"; return (${expr})`);
    const result = Array.isArray(data)
      ? data.filter((item, index) => fn(item, index))
      : [data].filter((item, index) => fn(item, index));
    return { result, error: null, count: result.length };
  } catch (e) {
    return { result: [], error: e.message, count: 0 };
  }
}
