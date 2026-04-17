import { describe, expect, it } from "vitest";
import { getMatchTone } from "./uiTools";

describe("getMatchTone", () => {
  it("returns neutral tone when total is zero", () => {
    const tone = getMatchTone(0, 0);
    expect(tone.name).toBe("neutral");
  });

  it("returns red tone for low match ratio", () => {
    const tone = getMatchTone(1, 5);
    expect(tone.name).toBe("danger");
  });

  it("returns yellow tone for medium match ratio", () => {
    const tone = getMatchTone(2, 5);
    expect(tone.name).toBe("warning");
  });

  it("returns green tone for high match ratio", () => {
    const tone = getMatchTone(4, 5);
    expect(tone.name).toBe("success");
  });
});
