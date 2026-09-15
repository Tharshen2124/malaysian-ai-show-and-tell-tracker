import { describe, expect, it } from "vitest";
import { NO_UPDATE, SUMMARY_SYSTEM_PROMPT, cleanSummary } from "../lib/summarise";

describe("cleanSummary", () => {
  it("collapses the whitespace a model leaves behind", () => {
    expect(cleanSummary("  Shipped the billing page;\n  it is live.  ")).toBe(
      "Shipped the billing page; it is live.",
    );
  });

  it("strips wrapping quotes and a Update:/Summary: label", () => {
    expect(cleanSummary('"Shipped the billing page."')).toBe("Shipped the billing page.");
    expect(cleanSummary("“Shipped the billing page.”")).toBe("Shipped the billing page.");
    expect(cleanSummary("Update: Shipped the billing page.")).toBe("Shipped the billing page.");
    expect(cleanSummary("summary:  Shipped it.")).toBe("Shipped it.");
  });

  it("leaves an ordinary summary alone", () => {
    const text = "Cut parse time from 40s to 4s by moving OCR off the main thread.";
    expect(cleanSummary(text)).toBe(text);
  });

  it("passes the no-update sentinel through, since that is a real answer", () => {
    expect(cleanSummary(NO_UPDATE)).toBe(NO_UPDATE);
  });

  it("rejects nothing-answers so the caller can fall back to the transcript", () => {
    expect(cleanSummary("")).toBeNull();
    expect(cleanSummary("   ")).toBeNull();
    expect(cleanSummary(undefined)).toBeNull();
    expect(cleanSummary(null)).toBeNull();
  });

  it("rejects an answer long enough to be the transcript rather than a summary", () => {
    // A model that ignored the brief and echoed the talk back must not overwrite
    // a perfectly good transcript with a worse copy of itself.
    expect(cleanSummary("word ".repeat(200))).toBeNull();
  });
});

describe("SUMMARY_SYSTEM_PROMPT", () => {
  it("tells the model the exact sentinel the code checks for", () => {
    expect(SUMMARY_SYSTEM_PROMPT).toContain(NO_UPDATE);
  });
});
