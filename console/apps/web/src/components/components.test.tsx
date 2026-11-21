import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SceneEvent } from "@argus/protocol";
import { Transcript } from "./Transcript";
import { Scoreboard } from "./Scoreboard";

describe("Transcript", () => {
  it("does not treat scrollIntoView's promise as an effect cleanup", () => {
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = (() => Promise.resolve()) as typeof original;
    try {
      const view = render(
        <Transcript entries={[{ key: "1", role: "user", text: "hello", partial: false }]} />,
      );
      expect(() => view.unmount()).not.toThrow();
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  it("renders hostile text as inert text, not HTML", () => {
    const evil = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    const { container } = render(
      <Transcript entries={[{ key: "1", role: "assistant", text: evil, partial: true }]} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(evil, { exact: false })).toBeInTheDocument();
  });
});

describe("Scoreboard", () => {
  it("shows scores from events", () => {
    const e = (i: number, type: string, team?: string): SceneEvent => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      stream_id: "c",
      ts_ms: i,
      wall_ms: 1,
      type,
      confidence: 1,
      actors: [],
      attrs: team ? { team } : {},
      summary: "",
      scenario: "pickleball_referee",
    });
    render(<Scoreboard events={[e(1, "rally.start"), e(2, "point.won", "a"), e(3, "point.won", "a")]} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/rallies: 1/)).toBeInTheDocument();
  });
});
