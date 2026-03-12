import { describe, it, expect } from "vitest";
import { friendlyAiError } from "@/lib/utils/errors";

describe("friendlyAiError", () => {
  it("handles credit balance errors", () => {
    const msg = friendlyAiError(new Error("Your credit balance is too low"));
    expect(msg).toContain("billing");
  });

  it("handles rate limit errors", () => {
    const msg = friendlyAiError(new Error("rate limit exceeded"));
    expect(msg).toContain("busy");
  });

  it("handles 429 status codes", () => {
    const msg = friendlyAiError(new Error("Request failed with status 429"));
    expect(msg).toContain("busy");
  });

  it("handles overloaded errors", () => {
    const msg = friendlyAiError(new Error("API is overloaded"));
    expect(msg).toContain("high demand");
  });

  it("handles 503 errors", () => {
    const msg = friendlyAiError(new Error("503 Service Unavailable"));
    expect(msg).toContain("high demand");
  });

  it("handles not_found / 404 errors", () => {
    const msg = friendlyAiError(new Error("model: not_found_error 404"));
    expect(msg).toContain("configuration");
  });

  it("handles auth / 401 errors", () => {
    const msg = friendlyAiError(new Error("authentication failed 401"));
    expect(msg).toContain("API key");
  });

  it("handles api_key errors", () => {
    const msg = friendlyAiError(new Error("Invalid api_key provided"));
    expect(msg).toContain("API key");
  });

  it("handles timeout errors", () => {
    const msg = friendlyAiError(new Error("Request timeout"));
    expect(msg).toContain("connection");
  });

  it("handles network errors", () => {
    const msg = friendlyAiError(new Error("network error"));
    expect(msg).toContain("connection");
  });

  it("handles 502 errors", () => {
    const msg = friendlyAiError(new Error("502 Bad Gateway"));
    expect(msg).toContain("connection");
  });

  it("returns generic message for unknown errors", () => {
    const msg = friendlyAiError(new Error("something totally unexpected"));
    expect(msg).toContain("Something went wrong");
  });

  it("handles non-Error values", () => {
    const msg = friendlyAiError("raw string error");
    expect(msg).toContain("Something went wrong");
  });

  it("handles null/undefined", () => {
    const msg = friendlyAiError(null);
    expect(msg).toContain("Something went wrong");
  });
});
