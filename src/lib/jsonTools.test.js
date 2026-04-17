import { describe, expect, it } from "vitest";
import { resolvePath, tryFilter, tryParseJSON } from "./jsonTools";

describe("tryParseJSON", () => {
  it("parses valid JSON", () => {
    const result = tryParseJSON('{"ok":true}');
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ ok: true });
  });

  it("returns parse error for invalid JSON", () => {
    const result = tryParseJSON("{");
    expect(result.data).toBeNull();
    expect(result.error).toBeTypeOf("string");
  });
});

describe("resolvePath", () => {
  it("returns array at dot path", () => {
    const input = { data: { orders: [{ id: 1 }] } };
    const result = resolvePath(input, "data.orders");
    expect(result.error).toBeNull();
    expect(result.value).toEqual([{ id: 1 }]);
  });

  it("returns error when resolved path is not an array", () => {
    const input = { data: { status: "ok" } };
    const result = resolvePath(input, "data.status");
    expect(result.value).toBeNull();
    expect(result.error).toContain("not an array");
  });
});

describe("tryFilter", () => {
  it("filters with expression and returns count", () => {
    const result = tryFilter(
      [{ reason: 0 }, { reason: 4 }, { reason: 2 }],
      "item.reason !== 0",
    );
    expect(result.error).toBeNull();
    expect(result.count).toBe(2);
    expect(result.result).toEqual([{ reason: 4 }, { reason: 2 }]);
  });

  it("returns expression error when invalid", () => {
    const result = tryFilter([{ reason: 0 }], "item.");
    expect(result.result).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.error).toBeTypeOf("string");
  });
});
