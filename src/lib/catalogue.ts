import type { FailureMode } from "./types";

const entries: FailureMode[] = [
  {
    id: "brief-event-blindness",
    index: 1,
    title: "The event between frames",
    shortTitle: "Brief-event blindness",
    subtitle:
      "A salient event can occur in the source video yet never enter the model’s effective observation stream.",
    modalities: ["video"],
    stages: ["frame-sampling", "compression"],
    capabilities: ["brief-event-detection", "state-transitions"],
    evidence: "behavioral-evidence",
    sourceIds: ["videoqa-study", "tempcompass", "video-mme-v2"],
    trigger: "Shorten a high-contrast event and vary its phase within an otherwise identical video.",
    symptom: "The model denies that the event occurred or answers according to adjacent sampled states.",
    violatedExpectation:
      "An event that remains easy for a human observer should influence the answer regardless of its phase in the file.",
    mechanism:
      "Consistent with frame subsampling or temporal pooling removing the event before downstream reasoning; native provider preprocessing is usually not disclosed.",
    alternatives: [
      "The event was sampled but poorly encoded",
      "The visual fact survived but language decoding ignored it",
      "Video transcoding altered the event",
    ],
    disconfirmingTest:
      "Provide the critical frame explicitly or lengthen only the event while keeping all semantic content fixed.",
    mitigations: [
      "Adaptive temporal sampling",
      "Motion-triggered glimpses",
      "Question-conditioned frame retrieval",
    ],
    severity: "foundational",
    reproducibility: "high",
    generator: "brief-event",
    accent: "vermillion",
    featured: true,
  },
  {
    id: "attribute-binding-swap",
    index: 2,
    title: "The right facts, on the wrong objects",
    shortTitle: "Attribute-binding swap",
    subtitle:
      "Models may detect every object and colour while assigning those attributes to the wrong entities.",
    modalities: ["image", "video"],
    stages: ["object-state-representation", "cross-modal-projection"],
    capabilities: ["attribute-binding", "comparison"],
    evidence: "literature-established",
    sourceIds: ["perceptionbench", "eyes-wide-shut"],
    trigger: "Present several similar objects with independently randomized colours, shapes, and positions.",
    symptom: "The response names attributes present in the image but binds them to incorrect objects.",
    violatedExpectation: "Recognition of a set of objects and attributes should preserve their pairings.",
    mechanism:
      "Distributed features and lossy token compression may preserve which attributes exist while weakening object-specific bindings.",
    alternatives: [
      "Question referent ambiguity",
      "Spatial relation error",
      "Language-side answer transposition",
    ],
    disconfirmingTest:
      "Keep the same feature inventory but permute only object–attribute assignments in balanced minimal pairs.",
    mitigations: [
      "Object-centric tokens",
      "Grounded intermediate representations",
      "Coordinate-aware decoding",
    ],
    severity: "foundational",
    reproducibility: "high",
    generator: "attribute-binding",
    accent: "cobalt",
    featured: true,
  },
  {
    id: "patch-phase-sensitivity",
    index: 3,
    title: "A one-pixel move changes the mind",
    shortTitle: "Patch-phase sensitivity",
    subtitle:
      "Equivalent images may be represented differently when content moves relative to an encoder’s patch lattice.",
    modalities: ["image"],
    stages: ["preprocessing", "tokenization", "vision-encoding"],
    capabilities: ["detection", "spatial-relations"],
    evidence: "hypothesis",
    sourceIds: ["vlms-blind", "eyes-wide-shut"],
    trigger: "Translate identical geometry across a known open-model patch grid without changing the answer.",
    symptom: "Accuracy oscillates with pixel offset, image padding, or resize dimensions.",
    violatedExpectation: "A small translation that preserves scene semantics should preserve the answer.",
    mechanism:
      "Hypothesis: non-overlapping patchification and stride can cause aliasing and redistribute weak features across tokens.",
    alternatives: ["Resize-kernel artifacts", "Positional encoding sensitivity", "Random decoding variation"],
    disconfirmingTest:
      "Sweep all phase offsets after calculating the exact post-resize patch lattice and test for periodicity.",
    mitigations: ["Overlapping stems", "Anti-aliasing", "Multi-scale or shift-averaged encoding"],
    severity: "high",
    reproducibility: "emerging",
    generator: "patch-phase",
    accent: "citron",
    featured: true,
  },
  {
    id: "counting-density-confound",
    index: 4,
    title: "Counting becomes texture",
    shortTitle: "Numerosity–density confound",
    subtitle: "The number of objects can be confused with occupied area, spacing, or visual density.",
    modalities: ["image", "video"],
    stages: ["vision-encoding", "object-state-representation"],
    capabilities: ["counting"],
    evidence: "literature-established",
    sourceIds: ["perceptionbench", "vlms-blind"],
    trigger:
      "Vary count while holding total occupied area constant, then vary density while holding count constant.",
    symptom: "Answers track aggregate ink or density rather than discrete object number.",
    violatedExpectation:
      "Numerosity should remain stable under irrelevant changes in object size and spacing.",
    mechanism:
      "Global texture and density statistics can be easier to encode than individuated object slots.",
    alternatives: [
      "Overlapping objects are not segmented",
      "Output token prior",
      "Approximate rather than exact counting strategy",
    ],
    disconfirmingTest:
      "Factorially cross count, object size, spacing, and occupied area with balanced labels.",
    mitigations: ["Object proposals", "Iterative marking", "Explicit counting supervision"],
    severity: "foundational",
    reproducibility: "high",
    generator: "numerosity-density",
    accent: "violet",
    featured: true,
  },
  {
    id: "small-object-erasure",
    index: 5,
    title: "Too small to survive",
    shortTitle: "Small-object erasure",
    subtitle: "An answer-bearing detail can vanish during resize, patch projection, or token compression.",
    modalities: ["image", "video"],
    stages: ["preprocessing", "tokenization", "compression"],
    capabilities: ["detection", "recognition", "ocr"],
    evidence: "literature-established",
    sourceIds: ["perceptionbench", "vlms-blind"],
    trigger:
      "Reduce only the angular or pixel size of a high-contrast target while preserving the wider scene.",
    symptom: "Performance drops abruptly below a scale threshold despite easy human zoom or inspection.",
    violatedExpectation: "A visible, unambiguous detail should remain available to answer a direct question.",
    mechanism:
      "Resizing and fixed-rate visual bottlenecks can mix the target with background before task-conditioned attention.",
    alternatives: ["Semantic unfamiliarity", "Crowding", "Question-dependent search failure"],
    disconfirmingTest: "Supply a crop at native scale and compare with an equal-resolution whole image.",
    mitigations: ["Dynamic resolution", "Foveated reacquisition", "High-resolution crops"],
    severity: "high",
    reproducibility: "high",
    generator: "small-object",
    accent: "teal",
    featured: true,
  },
  {
    id: "temporal-order-reversal",
    index: 6,
    title: "Before and after collapse",
    shortTitle: "Temporal-order reversal",
    subtitle: "A model may recognize both events while failing to distinguish A→B from B→A.",
    modalities: ["video"],
    stages: ["vision-encoding", "temporal-memory", "reasoning"],
    capabilities: ["temporal-order", "state-transitions"],
    evidence: "literature-established",
    sourceIds: ["tempcompass", "temporalbench", "videoqa-study", "arrow-time"],
    trigger: "Show a clip and its exact temporal reverse with counterbalanced questions.",
    symptom:
      "Answers remain unchanged under reversal or follow the more plausible narrative rather than observed order.",
    violatedExpectation: "Reversing an asymmetric event should reverse its temporal answer.",
    mechanism:
      "Order-invariant pooling, sparse frames, and caption-like training can privilege event presence over transition direction.",
    alternatives: [
      "Question ambiguity",
      "Frame timestamps omitted",
      "Physical prior overwhelms unusual reversed motion",
    ],
    disconfirmingTest:
      "Verify sampled evidence contains both states, then compare original, reversed, and shuffled controls.",
    mitigations: ["Timestamp supervision", "Arrow-of-time objectives", "Transition prediction"],
    severity: "foundational",
    reproducibility: "high",
    generator: "event-order",
    accent: "cobalt",
    featured: true,
  },
  {
    id: "identity-through-occlusion",
    index: 7,
    title: "The object that returned as another",
    shortTitle: "Identity through occlusion",
    subtitle: "Tracking can fail when visually similar entities disappear and re-emerge.",
    modalities: ["video"],
    stages: ["object-state-representation", "temporal-memory"],
    capabilities: ["identity-persistence", "tracking", "attribute-binding"],
    evidence: "behavioral-evidence",
    sourceIds: ["mvbench", "temporalbench", "video-mme-logical"],
    trigger:
      "Pass two distinguishable objects behind an occluder and independently swap their exit trajectories.",
    symptom: "The model reports the right final positions but attributes them to the wrong starting objects.",
    violatedExpectation:
      "Object identity should persist through temporary invisibility when motion permits an unambiguous assignment.",
    mechanism:
      "Frame-wise features and temporal compression may not maintain explicit object files across missing observations.",
    alternatives: [
      "Motion paths are genuinely ambiguous",
      "Colour attribute was lost",
      "Final localization error",
    ],
    disconfirmingTest: "Vary occlusion duration and crossing geometry while including visible-path controls.",
    mitigations: ["Track-centric memory", "Object permanence objectives", "Explicit trajectory slots"],
    severity: "foundational",
    reproducibility: "medium",
    generator: "identity-occlusion",
    accent: "violet",
    featured: true,
  },
  {
    id: "repeated-event-undercount",
    index: 8,
    title: "Once, twice, or many",
    shortTitle: "Repeated-event undercount",
    subtitle:
      "Repeated events can be represented as an occurrence type rather than an exact sequence of instances.",
    modalities: ["video"],
    stages: ["compression", "temporal-memory"],
    capabilities: ["event-frequency", "counting"],
    evidence: "behavioral-evidence",
    sourceIds: ["tempcompass", "temporalbench", "video-mme-v2"],
    trigger:
      "Vary the number and rhythm of identical flashes or collisions while holding total duration and appearance constant.",
    symptom: "The model reports a vague or systematically compressed count, especially at high rates.",
    violatedExpectation: "Exact event number should change monotonically with added visible instances.",
    mechanism:
      "Temporal pooling and semantic summarization may collapse repeated local events into a single 'repetition' feature.",
    alternatives: [
      "Events fall between sampled frames",
      "Motion blur merges events",
      "Numeral decoding bias",
    ],
    disconfirmingTest: "Compare native video with an explicit contact-sheet or timestamped-frame condition.",
    mitigations: ["Event boundary detection", "External counters", "Fine-grained temporal tokens"],
    severity: "high",
    reproducibility: "high",
    generator: "event-counting",
    accent: "vermillion",
    featured: true,
  },
  {
    id: "encoder-decoder-access-gap",
    index: 9,
    title: "Seen inside, unsayable outside",
    shortTitle: "Encoder–decoder access gap",
    subtitle:
      "A visual fact can be linearly decodable from the encoder yet unavailable through ordinary language prompting.",
    modalities: ["image"],
    stages: ["cross-modal-projection", "language-decoding"],
    capabilities: ["evidence-grounding", "spatial-relations"],
    evidence: "representation-evidence",
    sourceIds: ["vlms-blind"],
    trigger:
      "Use a task the model fails behaviorally, then train probes on intermediate visual representations.",
    symptom: "A lightweight probe succeeds where the full generative interface fails.",
    violatedExpectation:
      "Task-relevant information represented internally should be reliably accessible to downstream reasoning.",
    mechanism:
      "The multimodal projector, language training, or decoder policy may fail to route fine visual detail to output logits.",
    alternatives: [
      "Probe exploits dataset shortcuts",
      "Representation is decodable but not robustly usable",
      "Prompt mismatch",
    ],
    disconfirmingTest:
      "Use held-out generators, causal activation interventions, and probes at encoder, projector, and backbone stages.",
    mitigations: ["Perception-aware alignment", "Auxiliary readout losses", "Grounded intermediate tokens"],
    severity: "foundational",
    reproducibility: "medium",
    accent: "citron",
  },
  {
    id: "clip-blind-pairs",
    index: 10,
    title: "Different worlds, same embedding",
    shortTitle: "Contrastive feature collapse",
    subtitle:
      "Visually decisive differences can collapse when both images support nearly identical captions.",
    modalities: ["image"],
    stages: ["vision-encoding"],
    capabilities: ["recognition"],
    evidence: "representation-evidence",
    sourceIds: ["eyes-wide-shut"],
    trigger: "Construct pairs with similar global semantics but different low-level or relational facts.",
    symptom: "The encoder embeds them closely and downstream VLMs produce the same answer for both.",
    violatedExpectation: "Answer-changing visible differences should remain separable in the representation.",
    mechanism:
      "Instance-level image–text contrastive objectives reward caption equivalence more than exact geometry.",
    alternatives: [
      "Resolution loss",
      "Downstream projector collapse",
      "Insufficient paired training examples",
    ],
    disconfirmingTest:
      "Compare contrastive, self-supervised, and jointly language-trained visual encoders on identical pairs.",
    mitigations: ["Mixtures of visual features", "Fine-grained objectives", "Dense self-supervision"],
    severity: "foundational",
    reproducibility: "high",
    accent: "teal",
  },
];

// Literature-backed catalogue extensions. These entries intentionally avoid generator claims.
type CatalogueExtension = [
  string,
  string,
  string,
  string,
  FailureMode["modalities"],
  FailureMode["stages"],
  FailureMode["capabilities"],
  FailureMode["evidence"],
  string[],
];

const extensions: CatalogueExtension[] = [
  [
    "visible-spatial-relation",
    "Left becomes right",
    "Visible relation errors",
    "Directly visible left/right, above/below, inside/outside, and overlap relations are misread.",
    ["image"],
    ["vision-encoding", "reasoning"],
    ["spatial-relations"],
    "literature-established",
    ["perceptionbench", "vlms-blind", "dynasolidgeo"],
  ],
  [
    "depth-viewpoint-confusion",
    "The viewpoint trap",
    "Depth & viewpoint confusion",
    "Occlusion order, orientation, imagined viewpoint, and three-dimensional structure remain unreliable.",
    ["image", "video"],
    ["vision-encoding", "reasoning"],
    ["depth-viewpoint"],
    "literature-established",
    ["perceptionbench", "dynasolidgeo"],
  ],
  [
    "ocr-scale-rotation",
    "Letters at the edge of sight",
    "OCR under transformation",
    "Text recognition degrades sharply with scale, rotation, blur, occlusion, and unusual layout.",
    ["image", "video"],
    ["preprocessing", "vision-encoding"],
    ["ocr"],
    "literature-established",
    ["perceptionbench"],
  ],
  [
    "cross-region-integration",
    "The answer split across the page",
    "Cross-region integration",
    "Individually readable regions fail to combine into the required answer.",
    ["image", "multi-image"],
    ["context-integration", "reasoning"],
    ["cross-region-integration"],
    "literature-established",
    ["perceptionbench", "locovqa"],
  ],
  [
    "visual-comparison",
    "Almost the same",
    "Fine visual comparison",
    "Models misjudge same/different, larger/smaller, or subtle changes across elements.",
    ["image", "multi-image"],
    ["vision-encoding", "context-integration"],
    ["comparison"],
    "literature-established",
    ["perceptionbench", "eyes-wide-shut"],
  ],
  [
    "fine-grained-recognition",
    "The nearest familiar answer",
    "Fine-grained recognition",
    "Visually similar subtypes and entities are collapsed into a familiar parent category.",
    ["image", "video"],
    ["vision-encoding"],
    ["recognition"],
    "literature-established",
    ["perceptionbench"],
  ],
  [
    "visual-hallucination",
    "The object that was never there",
    "Visual hallucination",
    "The response asserts an object, label, or value unsupported by the media.",
    ["image", "video"],
    ["evidence-reliance", "language-decoding"],
    ["evidence-grounding"],
    "literature-established",
    ["perceptionbench", "videohallucer", "haven"],
  ],
  [
    "visual-distractor-overload",
    "The needle dissolves",
    "Visual distractor overload",
    "Relevant evidence becomes inaccessible as irrelevant images or visual regions accumulate.",
    ["multi-image", "interleaved"],
    ["context-integration", "evidence-reliance"],
    ["cross-region-integration"],
    "literature-established",
    ["locovqa"],
  ],
  [
    "temporal-grounding",
    "Right event, wrong moment",
    "Temporal grounding failure",
    "The model recognizes an event class but cannot locate when the answer-bearing instance occurred.",
    ["video"],
    ["frame-sampling", "context-integration"],
    ["localization", "temporal-order"],
    "literature-established",
    ["videoqa-study", "tempcompass"],
  ],
  [
    "motion-direction",
    "Motion without a direction",
    "Direction confusion",
    "Opposite motion directions elicit identical or physically preferred descriptions.",
    ["video"],
    ["vision-encoding", "reasoning"],
    ["duration-speed", "tracking"],
    "literature-established",
    ["tempcompass", "motionhalluc", "arrow-time"],
  ],
  [
    "speed-duration",
    "Fast, slow, long, short",
    "Speed and duration confusion",
    "Models conflate distance, speed, frame rate, and event duration.",
    ["video"],
    ["preprocessing", "reasoning"],
    ["duration-speed"],
    "literature-established",
    ["tempcompass", "temporalbench"],
  ],
  [
    "state-transition-memory",
    "The state that would not stay changed",
    "State-transition memory",
    "A model notices a change locally but later answers using the object’s earlier or typical state.",
    ["video"],
    ["temporal-memory", "object-state-representation"],
    ["state-transitions"],
    "behavioral-evidence",
    ["temporalbench", "video-mme-logical"],
  ],
  [
    "long-video-forgetting",
    "The vanishing beginning",
    "Long-video forgetting",
    "Evidence from early or sparse moments is lost as duration and distractor density increase.",
    ["video"],
    ["compression", "temporal-memory"],
    ["cross-region-integration"],
    "literature-established",
    ["video-mme-v2", "videoqa-study"],
  ],
  [
    "video-object-relation-hallucination",
    "A relation invented in motion",
    "Object–relation hallucination",
    "The model invents interactions or spatial relations not present in the clip.",
    ["video"],
    ["object-state-representation", "language-decoding"],
    ["spatial-relations", "evidence-grounding"],
    "literature-established",
    ["videohallucer", "haven"],
  ],
  [
    "spatiotemporal-sycophancy",
    "The video changes when challenged",
    "Spatiotemporal sycophancy",
    "Misleading feedback causes correct grounded judgments to reverse and acquire fabricated rationales.",
    ["video"],
    ["evidence-reliance", "calibration"],
    ["evidence-grounding"],
    "literature-established",
    ["sycophancy"],
  ],
  [
    "video-perturbation-insensitivity",
    "Change the video, keep the answer",
    "Video perturbation insensitivity",
    "Semantically important video changes affect answers less than superficial question or option changes.",
    ["video"],
    ["evidence-reliance", "evaluation-artifact"],
    ["evidence-grounding"],
    "literature-established",
    ["videoqa-study"],
  ],
  [
    "physical-arrow-of-time",
    "A world played backwards",
    "Arrow-of-time blindness",
    "Models fail to use the irreversible direction of physical processes when clips are reversed.",
    ["video"],
    ["reasoning", "temporal-memory"],
    ["temporal-order", "causality"],
    "literature-established",
    ["arrow-time"],
  ],
  [
    "kinematic-attribution",
    "The wrong limb moved",
    "Kinematic attribution error",
    "A genuine motion difference is assigned to the wrong body part, object, or phase.",
    ["video"],
    ["object-state-representation", "reasoning"],
    ["attribute-binding", "tracking"],
    "literature-established",
    ["motionhalluc"],
  ],
  [
    "causal-narrative-prior",
    "Plausible cause, absent evidence",
    "Causal narrative prior",
    "The model substitutes a plausible world narrative for the causal sequence actually shown.",
    ["video"],
    ["reasoning", "evidence-reliance"],
    ["causality"],
    "behavioral-evidence",
    ["video-mme-logical", "videoqa-study"],
  ],
  [
    "multi-question-inconsistency",
    "One video, incompatible answers",
    "Linked-answer inconsistency",
    "Answers to several questions about one clip are individually plausible but mutually incompatible.",
    ["video"],
    ["temporal-memory", "calibration"],
    ["evidence-grounding"],
    "literature-established",
    ["video-mme-v2"],
  ],
  [
    "answer-format-inflation",
    "Multiple choice knows more",
    "Format-dependent competence",
    "Performance changes sharply between multiple choice, yes/no, captioning, and open response for the same temporal fact.",
    ["video", "image"],
    ["language-decoding", "evaluation-artifact"],
    ["evidence-grounding"],
    "literature-established",
    ["tempcompass", "haven"],
  ],
  [
    "audiovisual-conflict",
    "When sound and sight disagree",
    "Audiovisual conflict",
    "The model may privilege one modality or fuse contradictory audiovisual evidence without calibrated uncertainty.",
    ["audiovisual"],
    ["context-integration", "evidence-reliance"],
    ["audiovisual-synchronization"],
    "hypothesis",
    ["mme-survey"],
  ],
];

for (const [offset, raw] of extensions.entries()) {
  const [id, title, shortTitle, subtitle, modalities, stages, capabilities, evidence, sourceIds] = raw;
  entries.push({
    id,
    index: 11 + offset,
    title,
    shortTitle,
    subtitle,
    modalities,
    stages,
    capabilities,
    evidence,
    sourceIds,
    trigger: "Use controlled minimal pairs that vary only the capability-bearing factor.",
    symptom: subtitle,
    violatedExpectation:
      "Answer-changing evidence should be represented and used, while irrelevant transformations should not change the answer.",
    mechanism:
      "The cited literature establishes the behavioral pattern; the responsible processing stage can differ by architecture and input pipeline.",
    alternatives: [
      "Input preprocessing",
      "Representation loss",
      "Cross-modal access failure",
      "Reasoning or decoding error",
    ],
    disconfirmingTest:
      "Intervene successively on acquisition, visual representation, textualized evidence, and output format to localize the earliest failure.",
    mitigations: [
      "Targeted diagnostic training",
      "Adaptive evidence acquisition",
      "Explicit grounded representations",
    ],
    severity: id.includes("format") ? "moderate" : "high",
    reproducibility: evidence === "hypothesis" ? "emerging" : "medium",
    accent: (["vermillion", "cobalt", "citron", "violet", "teal"] as const)[offset % 5],
  });
}

entries.push({
  id: "identity-conditioned-exact-counting",
  index: entries.length + 1,
  title: "Trace first, count exactly",
  shortTitle: "Identity-conditioned exact counting",
  subtitle:
    "A model can trace endpoints or estimate counts separately yet fail when it must preserve one visual identity and count only that path’s events.",
  modalities: ["image"],
  stages: ["vision-encoding", "object-state-representation", "reasoning"],
  capabilities: ["identity-persistence", "tracking", "counting", "cross-region-integration"],
  evidence: "reproduced-here",
  sourceIds: ["traversalbench"],
  trigger:
    "Ask for the exact number of crossings on one labeled wire among many distractor crossings, using adjacent answer values.",
  symptom:
    "Answers cluster one or two counts away from the truth even when the same route succeeds after the target path and crossings are highlighted.",
  violatedExpectation:
    "A continuous, unambiguous path that a person can trace should support an exact count of its marked interactions.",
  mechanism:
    "Consistent with lossy sustained visual identity or approximate magnitude replacing an exact identity-conditioned event representation.",
  alternatives: [
    "The crossing convention is misread",
    "Textual search consumes the reasoning budget",
    "Exact count decoding is weak despite successful tracing",
  ],
  disconfirmingTest:
    "Highlight and number only the target path’s crossings while preserving the same geometry, then compare exact paired responses.",
  mitigations: [
    "Path-conditioned visual attention",
    "Explicit object files",
    "External visual tracing and counting tools",
  ],
  affectedModels:
    "Confirmed on the frozen 2026-09-01 routes for Gemini 3.7 Flash, Kimi K3, and Qwen 3.8 Max at 40 crossings; Kimi used its separately declared no-reasoning forced-choice condition.",
  severity: "foundational",
  reproducibility: "high",
  accent: "cobalt",
  featured: true,
});

type ReproducedExtension = {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  modalities: FailureMode["modalities"];
  stages: FailureMode["stages"];
  capabilities: FailureMode["capabilities"];
  sourceIds: string[];
  trigger: string;
  symptom: string;
  mechanism: string;
  alternatives: string[];
  disconfirmingTest: string;
  mitigations: string[];
  severity?: FailureMode["severity"];
  generator?: FailureMode["generator"];
};

const reproducedExtensions: ReproducedExtension[] = [
  {
    id: "topological-enclosure-depth",
    title: "Count the walls around the point",
    shortTitle: "Topological enclosure depth",
    subtitle:
      "Dense nested boundaries defeat exact inside/outside depth even when every boundary is visible.",
    modalities: ["image"],
    stages: ["vision-encoding", "context-integration", "reasoning"],
    capabilities: ["spatial-relations", "counting", "cross-region-integration"],
    sourceIds: ["dynasolidgeo", "perceptionbench"],
    trigger:
      "Place a marked point inside a balanced field of nested and distracting closed curves and ask for its exact enclosure depth.",
    symptom: "The model selects a nearby depth while numbered-boundary controls recover much of the loss.",
    mechanism:
      "The task requires a global topological nesting representation rather than local edge detection. Control recovery is consistent with failure to convert visible contours into an exact containment hierarchy, but it does not identify the internal stage responsible.",
    alternatives: [
      "Boundary crossings are visually missed",
      "The marked point is localized incorrectly",
      "The answer is approximately counted",
    ],
    disconfirmingTest:
      "Preserve the geometry while successively numbering boundaries, highlighting only closed contours, and supplying an explicit containment tree.",
    mitigations: [
      "Topology-aware visual representations",
      "Iterative contour tracing",
      "External geometry tools",
    ],
    severity: "foundational",
  },
  {
    id: "rotation-invariant-visual-correspondence",
    title: "The same constellation, turned",
    shortTitle: "Rotation-invariant correspondence",
    subtitle:
      "A dense target constellation becomes difficult to match after rotation among near-miss candidates.",
    modalities: ["image"],
    stages: ["vision-encoding", "context-integration", "reasoning"],
    capabilities: ["comparison", "spatial-relations", "cross-region-integration"],
    sourceIds: ["perceptionbench", "dynasolidgeo"],
    trigger:
      "Rotate one irregular marked constellation and surround it with candidates that differ by only one or two relations.",
    symptom:
      "Answers approach the balanced-choice floor while highlighting the correct candidate sharply improves performance.",
    mechanism:
      "Exact matching requires a transformation-invariant relational code that preserves every local relation. The behavioral evidence cannot distinguish lossy encoding from a failure to search over rotations.",
    alternatives: [
      "Rotation is estimated inaccurately",
      "A small marker is missed",
      "Panel comparison order biases the choice",
    ],
    disconfirmingTest:
      "Sweep rotation continuously and compare against an equivalent task with canonicalized orientation and aligned correspondences.",
    mitigations: ["Equivariant encoders", "Canonical orientation", "Explicit point-set matching"],
    severity: "foundational",
  },
  {
    id: "global-bilateral-symmetry-verification",
    title: "One defect in a field of mirrors",
    shortTitle: "Global symmetry verification",
    subtitle: "Dense patterns with a single symmetry violation expose weak global correspondence checks.",
    modalities: ["image"],
    stages: ["vision-encoding", "context-integration", "reasoning"],
    capabilities: ["comparison", "cross-region-integration", "localization"],
    sourceIds: ["perceptionbench", "eyes-wide-shut"],
    trigger:
      "Present several dense panels where exactly one is bilaterally symmetric and the others contain sparse balanced defects.",
    symptom: "The correct panel is rarely selected until the decisive correspondence is marked.",
    mechanism:
      "The answer is a conjunction over many mirrored pairs; a compressed global impression of symmetry is insufficient. Oracle marking localizes the behavioral bottleneck to finding or integrating the decisive pair.",
    alternatives: [
      "The axis is misidentified",
      "A defect is below effective resolution",
      "The model uses texture similarity",
    ],
    disconfirmingTest:
      "Hold density fixed while varying defect count, distance from the axis, and explicit pair markings.",
    mitigations: [
      "Pairwise correspondence attention",
      "Multi-scale inspection",
      "Symmetry-specific verification passes",
    ],
    severity: "high",
  },
  {
    id: "occluded-3d-cube-enumeration",
    title: "Count what the stack conceals",
    shortTitle: "Occluded cube-stack enumeration",
    subtitle: "Exact totals require completing hidden support cubes rather than counting visible faces.",
    modalities: ["image"],
    stages: ["vision-encoding", "object-state-representation", "reasoning"],
    capabilities: ["counting", "depth-viewpoint", "spatial-relations"],
    sourceIds: ["dynasolidgeo", "perceptionbench"],
    trigger:
      "Render several isometric stacks with identical-looking surface density but different hidden support totals.",
    symptom: "Models choose visible-cube-like totals; annotated per-column totals restore the answer.",
    mechanism:
      "The latent variable is a 3D occupancy structure. Surface features do not uniquely encode the hidden support count without object completion and exact summation.",
    alternatives: [
      "Perspective conventions are misread",
      "Occluded support assumptions differ",
      "Arithmetic fails after correct reconstruction",
    ],
    disconfirmingTest:
      "Compare exploded views, transparent stacks, height maps, and annotated column totals for the same occupancy grid.",
    mitigations: ["Explicit 3D scene graphs", "Depth-aware object completion", "Programmatic counting tools"],
    severity: "foundational",
  },
  {
    id: "dense-visual-boolean-composition",
    title: "XOR every cell, then choose",
    shortTitle: "Dense visual XOR composition",
    subtitle: "Models fail a distributed Boolean operation even when every input bit is plainly rendered.",
    modalities: ["image"],
    stages: ["vision-encoding", "context-integration", "reasoning"],
    capabilities: ["comparison", "cross-region-integration"],
    sourceIds: ["revelio", "perceptionbench"],
    trigger:
      "Show two dense binary matrices and four near-miss outputs; ask which output is their cellwise XOR.",
    symptom: "Selections are near floor until mismatching cells in candidates are explicitly boxed.",
    mechanism:
      "Correctness requires preserving coordinate bindings across three panels and satisfying the rule at every cell. Local successes cannot compensate for one missed mismatch.",
    alternatives: [
      "The XOR rule is misunderstood",
      "Panel coordinates drift",
      "One-bit defects are visually missed",
    ],
    disconfirmingTest:
      "Factor matrix size, defect count, alignment guides, and a text-provided XOR intermediate independently.",
    mitigations: [
      "Coordinate-addressable visual memory",
      "Iterative verification",
      "External matrix operations",
    ],
    severity: "foundational",
  },
  {
    id: "dense-cross-image-change-localization",
    title: "Find the one glyph that changed",
    shortTitle: "Dense change localization",
    subtitle: "A single answer-bearing change disappears when two dense images must be aligned globally.",
    modalities: ["multi-image"],
    stages: ["vision-encoding", "context-integration", "reasoning"],
    capabilities: ["comparison", "localization", "cross-region-integration"],
    sourceIds: ["perceptionbench", "eyes-wide-shut"],
    trigger: "Present two large glyph grids with exactly one changed glyph and adjacent answer regions.",
    symptom: "The model selects the wrong region despite strong recovery when the changed glyph is circled.",
    mechanism:
      "The task requires exhaustive correspondence over many locations; lossy image summaries can preserve overall sameness while dropping the sole discriminative coordinate.",
    alternatives: [
      "The glyph distinction is not encoded",
      "Grid alignment is lost",
      "Search terminates early",
    ],
    disconfirmingTest:
      "Vary only grid size, glyph contrast, registration guides, and an oracle circle around the changed coordinate.",
    mitigations: ["Difference-map computation", "Tiled high-resolution inspection", "Learned visual search"],
    severity: "foundational",
  },
  {
    id: "visual-maze-reachability",
    title: "A path exists only globally",
    shortTitle: "Maze reachability",
    subtitle: "Local corridor visibility does not yield reliable end-to-end connectivity judgments.",
    modalities: ["image"],
    stages: ["vision-encoding", "context-integration", "reasoning"],
    capabilities: ["spatial-relations", "cross-region-integration"],
    sourceIds: ["traversalbench", "dynasolidgeo"],
    trigger: "Ask which endpoint is connected to a start in a dense maze with balanced near-miss branches.",
    symptom:
      "Models choose plausible nearby exits; highlighting the complete solution path strongly recovers accuracy.",
    mechanism:
      "Reachability is a transitive global property. Patch-local corridor features must be composed without losing branch state across many steps.",
    alternatives: [
      "A wall gap is missed",
      "Endpoint labels are confused",
      "The traversal policy revisits branches poorly",
    ],
    disconfirmingTest:
      "Hold pixels fixed while adding breadcrumb states, a highlighted path, or an explicit adjacency graph.",
    mitigations: ["Neural algorithmic traversal", "External search", "Hierarchical spatial memory"],
    severity: "foundational",
  },
  {
    id: "visual-graph-degree-topology",
    title: "Read the graph, not the drawing",
    shortTitle: "Visual graph-degree topology",
    subtitle:
      "Crossings, bends, and clutter obscure the degree structure needed for a global graph property.",
    modalities: ["image"],
    stages: ["vision-encoding", "object-state-representation", "reasoning"],
    capabilities: ["counting", "spatial-relations", "cross-region-integration"],
    sourceIds: ["traversalbench", "dynasolidgeo"],
    trigger: "Render several visually similar graphs and ask which satisfies a degree-parity property.",
    symptom:
      "Models select by drawing appearance rather than exact node degree; ringing the oracle graph recovers the choice.",
    mechanism:
      "The required invariant lives in discrete connectivity, not image texture. It demands reliable edge endpoint binding and an exact degree audit at every node.",
    alternatives: [
      "Edge crossings are treated as vertices",
      "Endpoints are missed",
      "The graph theorem is misapplied",
    ],
    disconfirmingTest:
      "Compare identical abstract graphs under different layouts, explicit node-edge lists, and marked edge endpoints.",
    mitigations: ["Graph extraction", "Topology-aware encoders", "Symbolic degree verification"],
    severity: "foundational",
  },
  {
    id: "global-visual-parity-verification",
    title: "Every row and every column",
    shortTitle: "2D parity verification",
    subtitle: "One-bit corruptions defeat a global parity audit across dense binary matrices.",
    modalities: ["image"],
    stages: ["vision-encoding", "context-integration", "reasoning"],
    capabilities: ["counting", "cross-region-integration", "comparison"],
    sourceIds: ["revelio", "perceptionbench"],
    trigger:
      "Ask which dense binary matrix has even parity in every row and column while each distractor differs by one bit.",
    symptom: "All tested routes remain below half while row-and-column audit annotations recover perfectly.",
    mechanism:
      "The decision is a high-order conjunction over distributed exact counts. Approximate numerosity or a few sampled rows cannot certify the whole matrix.",
    alternatives: [
      "A single bit is missed",
      "Counts are approximate",
      "Row and column results are not jointly retained",
    ],
    disconfirmingTest:
      "Sweep matrix size and expose row parities, column parities, or both as orthogonal controls.",
    mitigations: ["Structured visual scratchpads", "Exact external counting", "Constraint-checking decoders"],
    severity: "foundational",
  },
  {
    id: "identity-conditioned-spatial-transition-counting",
    title: "Count only one object’s entries",
    shortTitle: "Identity-conditioned zone entries",
    subtitle:
      "A moving target must retain identity while its entries into one region are counted among distractors.",
    modalities: ["video"],
    stages: ["object-state-representation", "temporal-memory", "reasoning"],
    capabilities: ["identity-persistence", "tracking", "counting", "state-transitions"],
    sourceIds: ["video-mme-logical", "temporalbench"],
    trigger:
      "Move several similar objects through a marked zone and ask for entries made only by one initially labeled target.",
    symptom: "Counts collapse until an oracle running counter is overlaid.",
    mechanism:
      "The computation composes identity tracking, boundary-transition detection, and an exact accumulator. Losing any binding produces a plausible but wrong count.",
    alternatives: [
      "The zone boundary is ambiguous",
      "Re-entry conventions differ",
      "The target identity is swapped",
    ],
    disconfirmingTest:
      "Independently expose target identity, entry events, and the cumulative count while preserving trajectories.",
    mitigations: ["Object-centric trackers", "Event counters", "Persistent identity labels"],
    severity: "foundational",
  },
  {
    id: "identity-pair-interaction-counting",
    title: "Which collisions satisfy both rules?",
    shortTitle: "Gated identity-pair collision counting",
    subtitle: "Models see labeled collisions yet fail to count only one pair under one frame-color gate.",
    modalities: ["video"],
    stages: ["object-state-representation", "temporal-memory", "reasoning"],
    capabilities: ["identity-persistence", "tracking", "counting", "attribute-binding"],
    sourceIds: ["video-mme-logical", "temporalbench"],
    trigger:
      "Animate 32 labeled collisions and count only events where both a case-variable identity pair and a case-variable frame color match.",
    symptom:
      "All five evaluated routes remain below half while an exact matched-event counter recovers to at least 12/16 and usually 16/16.",
    mechanism:
      "Each local contact must be bound to an unordered identity pair, gated by frame color, and conditionally accumulated. Six wrong-color target-pair collisions make either predicate alone insufficient.",
    alternatives: [
      "Frame color is ignored",
      "The pair predicate is ignored",
      "Qualified events are not accumulated exactly",
    ],
    disconfirmingTest:
      "Keep the sequence fixed while exposing pair matches, gate matches, their conjunction, or only the running conjunctive counter.",
    mitigations: ["Pairwise relation tracks", "Predicate-gated event streams", "Explicit counters"],
    generator: "gated-pair-collision",
    severity: "foundational",
  },
  {
    id: "sequential-identity-permutation",
    title: "Follow the label through every swap",
    shortTitle: "Sequential identity permutation",
    subtitle: "Repeated pairwise swaps erase the mapping between starting identities and final positions.",
    modalities: ["video"],
    stages: ["object-state-representation", "temporal-memory"],
    capabilities: ["identity-persistence", "tracking", "attribute-binding"],
    sourceIds: ["mvbench", "video-mme-logical"],
    trigger: "Label objects briefly, hide the labels, and execute a balanced sequence of pairwise swaps.",
    symptom: "Final identity assignments approach chance while persistent labels recover strongly.",
    mechanism:
      "Each swap composes a permutation update; a single lost update irreversibly corrupts the final identity map. Frame-wise recognition alone is insufficient.",
    alternatives: [
      "One swap is visually missed",
      "Objects become locally indistinguishable",
      "The final position is mislocalized",
    ],
    disconfirmingTest:
      "Sweep swap count and reveal labels during only selected swaps to locate where the permutation state is lost.",
    mitigations: ["Persistent object files", "Permutation-state scratchpads", "Trajectory tracking"],
    severity: "foundational",
  },
  {
    id: "identity-conditioned-temporal-event-counting",
    title: "Count flashes from the right source",
    shortTitle: "Selective flash counting",
    subtitle: "Brief repeated events must be assigned to one identity before they can be counted exactly.",
    modalities: ["video"],
    stages: ["frame-sampling", "object-state-representation", "temporal-memory"],
    capabilities: ["brief-event-detection", "attribute-binding", "counting"],
    sourceIds: ["synflash", "frame-sampling-matters", "tempcompass"],
    trigger:
      "Interleave short flashes from several objects and ask for the count emitted by one designated identity.",
    symptom: "All routes remain below half while a persistent-answer intervention recovers perfectly.",
    mechanism:
      "The computation requires event acquisition, source binding, and exact accumulation. The persistent-answer control proves response access but does not by itself separate sampling from binding loss.",
    alternatives: ["Flashes are not sampled", "Sources are misbound", "Repeated events are compressed"],
    disconfirmingTest:
      "Cross event duration with source isolation, persistent event markers, and a final explicit count.",
    mitigations: ["Adaptive frame sampling", "Event-source tracks", "Persistent counters"],
    severity: "foundational",
  },
  {
    id: "temporal-pattern-counting",
    title: "Count a transition, not a symbol",
    shortTitle: "Target-transition counting",
    subtitle: "Exact counts of one adjacent event pair fail in a rapid symbolic stream.",
    modalities: ["video"],
    stages: ["temporal-memory", "reasoning"],
    capabilities: ["temporal-order", "state-transitions", "counting"],
    sourceIds: ["tempcompass", "video-mme-logical"],
    trigger: "Present a long symbol stream and ask how often one ordered adjacent pair occurs.",
    symptom:
      "Models recognize symbols but miss the exact pair count; an on-screen running transition counter yields 16/16 on every route.",
    mechanism:
      "Unlike symbol frequency, the state update depends on both the previous and current event. The task probes a minimal order-sensitive finite-state computation.",
    alternatives: [
      "Individual symbols are missed",
      "Direction of the pair is reversed",
      "Counts are approximate",
    ],
    disconfirmingTest:
      "Compare symbol counts, unordered co-occurrence counts, ordered pair counts, and a running-counter intervention on the same streams.",
    mitigations: ["Order-aware temporal tokens", "Finite-state scratchpads", "External event parsing"],
    severity: "foundational",
  },
  {
    id: "temporal-set-cardinality",
    title: "Which places occurred exactly twice?",
    shortTitle: "Gated frequency-set cardinality",
    subtitle: "A color-gated stream defeats exact per-location frequency tracking and set construction.",
    modalities: ["video"],
    stages: ["temporal-memory", "object-state-representation", "reasoning"],
    capabilities: ["localization", "counting", "state-transitions"],
    sourceIds: ["video-mme-logical", "temporalbench"],
    trigger:
      "Flash 40 labeled locations under alternating frame colors and ask how many cells occurred exactly twice under one designated color.",
    symptom:
      "All five routes remain below half while a visible target-color histogram restores every control to 16/16.",
    mechanism:
      "The sufficient state is a color-conditioned histogram followed by an exact-frequency predicate and a set cardinality. Each event requires gate selection, location binding, a per-cell update, and a final multiplicity query.",
    alternatives: [
      "The frame-color gate is ignored",
      "Locations are misbound",
      "Counts are compressed to a coarse frequency summary",
    ],
    disconfirmingTest:
      "Cross the color gate with event rate and separately expose accepted events, per-cell counts, or only the final qualifying set.",
    mitigations: [
      "Event-conditioned spatial memory",
      "Persistent per-cell histograms",
      "Question-conditioned event filtering",
    ],
    generator: "gated-frequency",
    severity: "foundational",
  },
  {
    id: "dynamic-route-turn-integration",
    title: "Count turns along an invisible trail",
    shortTitle: "Dynamic route-turn integration",
    subtitle: "Successive movements must be integrated and compared to detect each direction change.",
    modalities: ["video"],
    stages: ["temporal-memory", "object-state-representation", "reasoning"],
    capabilities: ["tracking", "temporal-order", "counting"],
    sourceIds: ["video-mme-logical", "tempcompass"],
    trigger:
      "Move a marker through a long axis-aligned route that leaves no trail and ask for its exact turn count.",
    symptom:
      "Seed-disjoint replication yields 2/16, 2/16, and 3/16; an explicit running turn counter yields 16/16 throughout.",
    mechanism:
      "Every segment must update a previous-direction state and increment only on changes. Sparse or lossy trajectory summaries preserve motion without the exact transition sequence.",
    alternatives: [
      "Short segments are missed",
      "Pauses are counted as turns",
      "Direction changes are not retained",
    ],
    disconfirmingTest:
      "Expose the trail, the current direction, or only the running turn count as separate controls.",
    mitigations: [
      "Trajectory extraction",
      "Directional state machines",
      "Question-conditioned temporal sampling",
    ],
    severity: "foundational",
  },
  {
    id: "dynamic-conservation-ledger",
    title: "Keep four quantities conserved",
    shortTitle: "Dynamic conservation ledger",
    subtitle:
      "A sequence of visible transfers defeats exact latent quantity updates across several containers.",
    modalities: ["video"],
    stages: ["temporal-memory", "reasoning"],
    capabilities: ["state-transitions", "counting", "causality"],
    sourceIds: ["video-mme-logical", "ec-bench"],
    trigger:
      "Initialize several container counts, perform many directed transfers, and ask which container ends largest.",
    symptom:
      "Native performance remains below half while a visible ledger makes the same final comparison easy.",
    mechanism:
      "The task is a conserved multi-register program: each transfer decrements one bound state and increments another. One missed or misbound update contaminates every later state.",
    alternatives: [
      "Source and destination are swapped",
      "Transfer magnitude is missed",
      "Final comparison rather than updating fails",
    ],
    disconfirmingTest:
      "Expose arrows, transfer magnitudes, individual register values, and the complete running ledger in successive interventions.",
    mitigations: ["Explicit state tables", "Tool-assisted arithmetic", "Structured recurrent memory"],
    severity: "foundational",
  },
  {
    id: "dynamic-trajectory-topology",
    title: "Remember where the path crossed itself",
    shortTitle: "Trajectory self-intersections",
    subtitle: "A moving marker’s route must be integrated geometrically to count true self-crossings.",
    modalities: ["video"],
    stages: ["temporal-memory", "object-state-representation", "reasoning"],
    capabilities: ["tracking", "spatial-relations", "counting"],
    sourceIds: ["video-mme-logical", "traversalbench"],
    trigger:
      "Animate an orthogonal route without a trail and ask for the number of proper crossings with earlier segments.",
    symptom:
      "Native self-crossing counts remain below half; even a visible-trail control remains difficult for some routes.",
    mechanism:
      "The answer requires building a geometric path and testing new segments against earlier nonadjacent segments. Because the visible-trail control does not fully recover, current evidence does not localize the failure specifically to temporal memory.",
    alternatives: [
      "The route is not retained",
      "Turns are mistaken for crossings",
      "Static crossing enumeration itself fails",
    ],
    disconfirmingTest:
      "Compare no trail, persistent trail, marked crossing points, and a final static path using identical geometry.",
    mitigations: ["Persistent trajectory maps", "Segment-intersection tools", "Geometry-aware memory"],
    severity: "foundational",
  },
  {
    id: "signed-temporal-state-accumulation",
    title: "Add every plus, subtract every minus",
    shortTitle: "Signed temporal accumulation",
    subtitle: "A long stream of +1 and −1 events defeats an exact one-register state update.",
    modalities: ["video"],
    stages: ["temporal-memory", "reasoning"],
    capabilities: ["state-transitions", "counting"],
    sourceIds: ["video-mme-logical", "tempcompass"],
    trigger:
      "Start a hidden counter at zero, show a balanced sequence of signed unit events, and ask for the exact final value.",
    symptom:
      "The frozen 61-event holdout yields 5/16, 3/16, and 4/16 while an explicit running-total control recovers strongly.",
    mechanism:
      "The sufficient state is only one signed integer, but every acquired event must update it in the correct direction. The task removes world knowledge and object identity while retaining exact online state maintenance.",
    alternatives: [
      "Some events are not acquired",
      "Minus signs are misread",
      "The sequence is summarized by rough color frequency",
    ],
    disconfirmingTest:
      "Sweep event rate and length while separately exposing sampled events, positive and negative subtotals, or the exact running total.",
    mitigations: ["Explicit recurrent counters", "Event-level temporal tokens", "External tally tools"],
    severity: "foundational",
  },
];

for (const definition of reproducedExtensions) {
  entries.push({
    ...definition,
    index: entries.length + 1,
    evidence: "reproduced-here",
    violatedExpectation:
      "A deterministic, fully visible construction with a construction-derived answer should support reliable exact inference at an appropriate difficulty setting.",
    affectedModels:
      "Evaluated in the atlas on pinned 2026-09-01 OpenRouter routes for Gemini 3.7 Flash, Qwen 3.8 Max, and Kimi K3; see the frozen run evidence for exact denominators and controls.",
    severity: definition.severity ?? "high",
    reproducibility: "high",
    accent: (["vermillion", "cobalt", "citron", "violet", "teal"] as const)[entries.length % 5],
  });
}

export const failureModes: FailureMode[] = entries.map((entry) => ({
  ...entry,
  affectedModels:
    entry.affectedModels ??
    "Behavior is reported only for the model cohorts in the cited studies; the atlas has not yet established a current cross-model affected set.",
}));
export const failureModesById = new Map(failureModes.map((entry) => [entry.id, entry]));

export const modalities = ["image", "video", "audiovisual", "multi-image", "interleaved"] as const;

export const humanize = (value: string) =>
  value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
