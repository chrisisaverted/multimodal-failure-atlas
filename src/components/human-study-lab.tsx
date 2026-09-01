"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { assignHumanStudyBlock, type StudyAssignmentMode } from "@/lib/human-study-assignment";

interface StudyCase {
  studyCaseId: string;
  catalogueId: string;
  planId: string;
  candidateId: string;
  modality: "image" | "video";
  artifactPath: string;
  mediaSha256: string;
  question: string;
  answerOptions: string[];
}

interface StudyBlock {
  blockId: string;
  cases: StudyCase[];
}

export interface StudyManifest {
  protocolId: string;
  blocks: StudyBlock[];
}

interface StudyResponse {
  studyCaseId: string;
  candidateId: string;
  catalogueId: string;
  selectedAnswer: string;
  mediaSha256: string;
  responseLatencyMs: number;
  presentationDurationMs: number;
  visibilityInterruptions: number;
  recordedAt: string;
}

interface SessionState {
  protocolId: string;
  sessionId: string;
  blockId: string;
  assignmentMode?: StudyAssignmentMode;
  startedAt: string;
  responses: StudyResponse[];
}

const storageKey = "failure-atlas-human-study-strict20-v1";

function downloadJson(filename: string, payload: unknown) {
  const url = URL.createObjectURL(
    new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function HumanStudyLab({ manifest, basePath }: { manifest: StudyManifest; basePath: string }) {
  const [session, setSession] = useState<SessionState>();
  const [ready, setReady] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [requestedBlockId, setRequestedBlockId] = useState<string | null>(null);
  const [invalidRecruitmentLink, setInvalidRecruitmentLink] = useState<string>();
  const displayedAt = useRef(0);
  const answerReadyAt = useRef(0);
  const visibilityInterruptions = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const requested = new URLSearchParams(window.location.search).get("block");
      if (requested) {
        if (manifest.blocks.some((block) => block.blockId === requested)) setRequestedBlockId(requested);
        else setInvalidRecruitmentLink(requested);
      }
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const restored = JSON.parse(raw) as SessionState;
          const validBlock = manifest.blocks.some((block) => block.blockId === restored.blockId);
          if (restored.protocolId === manifest.protocolId && validBlock) setSession(restored);
        }
      } catch {
        // A fresh, in-memory session remains available when storage is blocked or malformed.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [manifest]);

  useEffect(() => {
    function recordInterruption() {
      if (document.visibilityState === "hidden" && session && !recorded) visibilityInterruptions.current += 1;
    }
    document.addEventListener("visibilitychange", recordInterruption);
    return () => document.removeEventListener("visibilitychange", recordInterruption);
  }, [recorded, session]);

  const block = useMemo(
    () => manifest.blocks.find((candidate) => candidate.blockId === session?.blockId),
    [manifest, session?.blockId],
  );
  const index = Math.max(0, (session?.responses.length ?? 0) - (recorded ? 1 : 0));
  const current = block?.cases[index];

  function persist(next: SessionState) {
    setSession(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The downloadable in-memory packet remains usable.
    }
  }

  function begin() {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const assignment = assignHumanStudyBlock(
      manifest.blocks.map((block) => block.blockId),
      requestedBlockId,
      random[0]!,
    );
    const next: SessionState = {
      protocolId: manifest.protocolId,
      sessionId: crypto.randomUUID(),
      blockId: assignment.blockId,
      assignmentMode: assignment.assignmentMode,
      startedAt: new Date().toISOString(),
      responses: [],
    };
    persist(next);
  }

  async function startVideo(eventTimeStamp: number) {
    if (!videoRef.current || videoStarted) return;
    videoRef.current.currentTime = 0;
    videoRef.current.playbackRate = 1;
    displayedAt.current = eventTimeStamp;
    setVideoStarted(true);
    try {
      await videoRef.current.play();
    } catch {
      setVideoStarted(false);
    }
  }

  function answer(selectedAnswer: string, eventTimeStamp: number) {
    if (!session || !current || !ready || recorded) return;
    const now = eventTimeStamp;
    const response: StudyResponse = {
      studyCaseId: current.studyCaseId,
      candidateId: current.candidateId,
      catalogueId: current.catalogueId,
      selectedAnswer,
      mediaSha256: current.mediaSha256,
      responseLatencyMs: Math.max(0, Math.round(now - answerReadyAt.current)),
      presentationDurationMs: Math.max(0, Math.round(now - displayedAt.current)),
      visibilityInterruptions: visibilityInterruptions.current,
      recordedAt: new Date().toISOString(),
    };
    persist({ ...session, responses: [...session.responses, response] });
    setRecorded(true);
  }

  function next() {
    setReady(false);
    setVideoStarted(false);
    setRecorded(false);
    displayedAt.current = 0;
    answerReadyAt.current = 0;
    visibilityInterruptions.current = 0;
  }

  function exportPacket() {
    if (!session) return;
    downloadJson(`failure-atlas-${session.sessionId}.json`, {
      schemaVersion: 1,
      protocolId: manifest.protocolId,
      disclaimer: "Answer-free response packet; correctness has not been scored in the browser.",
      session,
    });
  }

  function reset() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // The in-memory reset still works.
    }
    setSession(undefined);
    next();
  }

  if (!hydrated) return <div className="study-loading">Loading the frozen study instrument…</div>;
  if (!session || !block) {
    return (
      <div className="study-intro">
        <p className="eyebrow">40 trials · approximately 20–35 minutes</p>
        <h2>No answers. No feedback. One frozen block.</h2>
        <p>
          Images remain visible until you answer. Each video can be played once at normal speed and must
          finish before its answer unlocks. Stay on this tab; interruptions are noted in your local packet.
        </p>
        <p>
          This demonstration does not transmit data and is not a consent form for a research study. Only begin
          if you want to test the answer-free instrument for yourself.
        </p>
        {invalidRecruitmentLink ? (
          <p role="alert">
            This recruitment link requests unknown block <strong>{invalidRecruitmentLink}</strong>. Ask the
            study coordinator for a corrected link; no fallback assignment has been made.
          </p>
        ) : (
          <>
            <p>
              {requestedBlockId
                ? `This recruitment link is quota-assigned to ${requestedBlockId}.`
                : "This unparameterized demonstration will choose a block uniformly at random."}
            </p>
            <button className="button-primary" type="button" onClick={begin}>
              {requestedBlockId ? "Begin assigned block" : "Assign my demo block"}
            </button>
          </>
        )}
      </div>
    );
  }

  if (!current) {
    return (
      <div className="study-complete">
        <p className="eyebrow">Block complete · {block.blockId}</p>
        <h2>{session.responses.length} answer-free responses recorded.</h2>
        <p>
          No score is shown, preserving blinding. Download the packet before clearing this browser session.
        </p>
        <button className="button-primary" type="button" onClick={exportPacket}>
          Download response packet
        </button>
        <button className="text-link" type="button" onClick={reset}>
          Clear and assign a new block
        </button>
      </div>
    );
  }

  return (
    <div className="human-study-lab">
      <div className="study-progress">
        <span>{block.blockId}</span>
        <span>
          Trial {index + 1} / {block.cases.length}
        </span>
      </div>
      <div className="study-progress-track" aria-hidden="true">
        <i style={{ width: `${(index / block.cases.length) * 100}%` }} />
      </div>
      <div className="study-question">
        <p>{current.question}</p>
      </div>
      <div className="study-media">
        {current.modality === "image" ? (
          <Image
            key={current.studyCaseId}
            src={`${basePath}${current.artifactPath}`}
            width={1800}
            height={1000}
            unoptimized
            alt={`Study stimulus ${index + 1}`}
            onLoad={(event) => {
              const now = event.timeStamp;
              displayedAt.current = now;
              answerReadyAt.current = now;
              setReady(true);
            }}
          />
        ) : (
          <>
            <video
              key={current.studyCaseId}
              ref={videoRef}
              playsInline
              preload="metadata"
              disablePictureInPicture
              controls={false}
              aria-label={`Study stimulus ${index + 1}`}
              onEnded={(event) => {
                answerReadyAt.current = event.timeStamp;
                setReady(true);
              }}
            >
              <source src={`${basePath}${current.artifactPath}`} type="video/mp4" />
            </video>
            {!videoStarted && (
              <button className="study-play" type="button" onClick={(event) => startVideo(event.timeStamp)}>
                Play once at 1×
              </button>
            )}
          </>
        )}
      </div>
      <div className="study-options" aria-label="Answer options">
        {current.answerOptions.map((option) => (
          <button
            type="button"
            key={option}
            disabled={!ready || recorded}
            onClick={(event) => answer(option, event.timeStamp)}
          >
            {option}
          </button>
        ))}
      </div>
      {recorded ? (
        <div className="study-recorded">
          <span>Response recorded—answer remains hidden.</span>
          <button type="button" onClick={next}>
            Continue
          </button>
        </div>
      ) : (
        <small>
          {ready
            ? "Choose one answer."
            : current.modality === "video"
              ? "Complete the video to answer."
              : "Loading the image…"}
        </small>
      )}
    </div>
  );
}
