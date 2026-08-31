# Provider input landscape

Snapshot retrieved 2026-08-30. This table records documented input surfaces, not measured capability. Provider documentation can change; every scored run must preserve a dated model ID and preprocessing path.

| Provider target    | What current official material establishes                                                                                                                                                        | Atlas status                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Google Gemini      | The [video-understanding guide](https://ai.google.dev/gemini-api/docs/video-understanding) documents direct video input and controllable clipping/frame rate.                                     | Gemini 3.7 Flash evaluated through pinned Google AI Studio routing.                                          |
| OpenAI GPT         | The [vision guide](https://developers.openai.com/api/docs/guides/images-vision) documents `input_image` analysis. It does not document a native video-analysis input type.                        | Not included in the native-video cohort.                                                                     |
| Anthropic Claude   | The [vision guide](https://platform.claude.com/docs/en/build-with-claude/vision) documents image content blocks and joint analysis of multiple images. It does not document a native video block. | Not included in the native-video cohort.                                                                     |
| OpenRouter cohort  | The [video input guide](https://openrouter.ai/docs/guides/overview/multimodal/videos) documents native video URL/data-URL messages and the routing API exposes model/provider endpoints.          | Ten model families evaluated with provider-only routing, fallbacks disabled, and data collection denied.     |
| Qwen local control | The [Qwen3-VL model card](https://huggingface.co/Qwen/Qwen3-VL-30B-A3B-Instruct) reports video understanding and local serving paths.                                                             | A pinned MLX-VLM runtime is prepared; it is a future local-control condition, not mixed with hosted results. |

The frozen hosted cohort comprises Gemini, Kimi, Qwen, GLM, MiniMax, StepFun, Seed, Nova, MiMo, and
Gemma. OpenRouter returned model aliases rather than dated revision strings in generations, so the
ledger distinguishes provider-returned IDs from the dated endpoint revisions resolved at protocol
freeze time. Absence from one guide is recorded narrowly as “not documented there,” never as proof
that another product or future endpoint cannot process video.
