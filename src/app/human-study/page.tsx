import type { Metadata } from "next";
import studyManifest from "@/data/human-study-manifest.json";
import { HumanStudyLab, type StudyManifest } from "@/components/human-study-lab";

export const metadata: Metadata = { title: "Human study instrument" };

export default function HumanStudyPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <>
      <section className="section-shell page-section study-page">
        <header className="page-header study-header">
          <p className="eyebrow">Answer-free human instrument · protocol v1</p>
          <h1>
            The same hard cases.
            <br />
            <em>Now ask a human.</em>
          </h1>
          <p>
            Eight balanced blocks cover every native case used to admit the atlas&apos;s 10 image and 10 video
            families. This page measures responses locally; it does not claim that a human study has happened.
          </p>
        </header>
        <div className="study-protocol-strip">
          <div>
            <strong>8</strong>
            <span>balanced blocks</span>
          </div>
          <div>
            <strong>40</strong>
            <span>trials per person</span>
          </div>
          <div>
            <strong>320</strong>
            <span>unique native cases</span>
          </div>
          <div>
            <strong>0</strong>
            <span>answers in the packet</span>
          </div>
        </div>
        <HumanStudyLab manifest={studyManifest as StudyManifest} basePath={basePath} />
      </section>
      <section className="dark-section study-method-note">
        <div className="section-shell">
          <p className="eyebrow">What this establishes</p>
          <h2>Infrastructure first. Evidence only after recruitment.</h2>
          <p>
            The proposed confirmatory design uses 80 participants—10 per block—so every stimulus receives 10
            independent judgments. Ethics review, consent, recruitment, exclusions, and analysis must be fixed
            before those judgments are collected.
          </p>
          <a href="https://github.com/chrisisaverted/multimodal-failure-atlas/blob/main/docs/human-study-protocol.md">
            Read the complete protocol
          </a>
        </div>
      </section>
    </>
  );
}
