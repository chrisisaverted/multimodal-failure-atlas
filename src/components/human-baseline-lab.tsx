"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

interface BaselineCase {
  candidateId: string;
  artifactPath: string;
  question: string;
  answerOptions: string[];
  expectedAnswer: string;
  count: number | string;
  mediaType?: "video" | "image";
}

interface BaselineResponse {
  candidateId: string;
  selectedAnswer: string;
  expectedAnswer: string;
  correct: boolean;
  responseTimeMs: number;
  recordedAt: string;
}

const storageKey = "failure-atlas-human-self-test-v1";

export function HumanBaselineLab({ cases, basePath }: { cases: BaselineCase[]; basePath: string }) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<BaselineResponse[]>([]);
  const [selected, setSelected] = useState<string>();
  const startedAt = useRef(0);
  const current = cases[index];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return;
        const restored = JSON.parse(stored) as BaselineResponse[];
        setResponses(restored);
        const answered = new Set(restored.map((response) => response.candidateId));
        const firstUnanswered = cases.findIndex((candidate) => !answered.has(candidate.candidateId));
        setIndex(firstUnanswered === -1 ? cases.length : firstUnanswered);
      } catch {
        // Invalid or blocked storage starts a fresh local session.
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [cases]);

  const sessionAccuracy = useMemo(
    () => (responses.length ? responses.filter((response) => response.correct).length / responses.length : 0),
    [responses],
  );

  function answer(value: string, eventTimeStamp: number) {
    if (!current || selected) return;
    const response: BaselineResponse = {
      candidateId: current.candidateId,
      selectedAnswer: value,
      expectedAnswer: current.expectedAnswer,
      correct: value === current.expectedAnswer,
      responseTimeMs: Math.max(0, Math.round(eventTimeStamp - startedAt.current)),
      recordedAt: new Date().toISOString(),
    };
    const next = [...responses.filter((item) => item.candidateId !== current.candidateId), response];
    setSelected(value);
    setResponses(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Keep the in-memory result when persistence is unavailable.
    }
  }

  function next(eventTimeStamp: number) {
    setIndex((value) => value + 1);
    setSelected(undefined);
    startedAt.current = eventTimeStamp;
  }

  function exportSession() {
    const payload = {
      protocol: "human-self-test-v1",
      disclaimer: "Local self-test; not an aggregated or research-grade human baseline.",
      userAgent: navigator.userAgent,
      responses,
    };
    const url = URL.createObjectURL(
      new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "failure-atlas-human-self-test.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!current) {
    return (
      <div className="baseline-complete">
        <p className="eyebrow">Local session complete</p>
        <h2>{Math.round(sessionAccuracy * 100)}% correct</h2>
        <p>
          {responses.filter((response) => response.correct).length}/{responses.length} responses. This is a
          personal instrumentation check, not evidence of population-level human performance.
        </p>
        <button className="button-primary" type="button" onClick={exportSession}>
          Download session JSON
        </button>
      </div>
    );
  }

  const answeredCorrectly = selected === current.expectedAnswer;
  return (
    <div className="baseline-lab">
      <div className="baseline-progress">
        <span>
          Specimen {index + 1} / {cases.length}
        </span>
        <span>{responses.length} recorded locally</span>
      </div>
      {current.mediaType === "image" ? (
        <Image
          key={current.candidateId}
          src={`${basePath}${current.artifactPath}`}
          width={1800}
          height={900}
          unoptimized
          onLoad={(event) => {
            startedAt.current = event.timeStamp;
          }}
          alt={`Visual counting specimen ${index + 1}`}
        />
      ) : (
        <video
          key={current.candidateId}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            startedAt.current = event.timeStamp;
          }}
          aria-label={`Counting specimen ${index + 1}`}
        >
          <source src={`${basePath}${current.artifactPath}`} type="video/mp4" />
        </video>
      )}
      <div className="baseline-question">
        <p>{current.question}</p>
        <div className="baseline-options" aria-label="Answer options">
          {current.answerOptions.map((option) => (
            <button
              type="button"
              key={option}
              disabled={Boolean(selected)}
              className={selected === option ? "selected" : ""}
              onClick={(event) => answer(option, event.timeStamp)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {selected ? (
        <div className={answeredCorrectly ? "baseline-feedback correct" : "baseline-feedback incorrect"}>
          <div>
            <b>{answeredCorrectly ? "Correct." : `Incorrect. The constructed answer is ${current.count}.`}</b>
            <p>The answer is revealed only after the local response is recorded.</p>
          </div>
          <button type="button" onClick={(event) => next(event.timeStamp)}>
            Next specimen
          </button>
        </div>
      ) : (
        <small>Inspect the complete specimen, then choose once. Viewing time is recorded locally.</small>
      )}
    </div>
  );
}
