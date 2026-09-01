// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HumanStudyLab, type StudyManifest } from "@/components/human-study-lab";

const manifest: StudyManifest = {
  protocolId: "study-test-v1",
  blocks: [
    {
      blockId: "block-01",
      cases: [
        {
          studyCaseId: "study-case",
          catalogueId: "family",
          planId: "plan",
          candidateId: "candidate",
          modality: "image",
          artifactPath: "/test.png",
          mediaSha256: "a".repeat(64),
          question: "Test question?",
          answerOptions: ["A", "B"],
        },
      ],
    },
  ],
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("human study recruitment links", () => {
  it("shows the block pinned by a valid quota link", async () => {
    window.history.replaceState({}, "", "/human-study?block=block-01");
    render(<HumanStudyLab manifest={manifest} basePath="" />);
    expect(await screen.findByText("This recruitment link is quota-assigned to block-01.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Begin assigned block" })).toBeEnabled();
  });

  it("fails closed instead of randomizing an invalid quota link", async () => {
    window.history.replaceState({}, "", "/human-study?block=block-99");
    render(<HumanStudyLab manifest={manifest} basePath="" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("unknown block block-99");
    expect(screen.queryByRole("button", { name: /block/i })).not.toBeInTheDocument();
  });

  it("labels unparameterized use as a random public demonstration", async () => {
    window.history.replaceState({}, "", "/human-study");
    render(<HumanStudyLab manifest={manifest} basePath="" />);
    expect(await screen.findByText(/choose a block uniformly at random/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Assign my demo block" })).toBeEnabled();
  });
});
