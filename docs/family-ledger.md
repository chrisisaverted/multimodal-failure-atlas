# Failure-family admission ledger

This ledger counts latent capability families, not prompts, skins, answer ranges, or difficulty cells.
An observed pass means every prespecified route is strictly below 50% on sixteen substantive frozen
holdout answers. Wilson-qualified and human-validated are stricter, separately reported states.

## Image families

| Family | State | Gemini | Qwen | Kimi | Control | Human |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Identity-conditioned exact crossing count | observed holdout pass | 7/16 | 0/16 | 1/16 | 16/16, 16/16, 13/16 | unverified |
| Topological enclosure depth | observed holdout pass | 6/16 | 7/16 | 5/16 | 16/16, 16/16, 10/16 | unverified |
| Rotation-invariant exact correspondence | holdout running | discovery 1/8 | discovery 2/8 | discovery 1/8 | pending | unverified |
| Dense cross-image change localization | discovery running | 34×34: 2/8 | pending | 34×34: 2/8 | pending | unverified |

The enclosure control only partially recovers Kimi, so it confirms behavioral difficulty but does not
fully localize the mechanism to open-versus-closed contour discrimination.

## Video families

No family is admitted under the current quota yet. Gemini 3.7 Flash, Qwen 3.8 Max, and Kimi K3 are
the initial video cohort because their current OpenRouter routes advertise video input; actual route
behavior must still be verified per protocol.

## Rejected or superseded searches

| Search | Reason it does not count |
| --- | --- |
| Single momentary symbol | Kimi solved the frozen native holdout 16/16. |
| Lattice flash counting | Gemini and Kimi each solved 12/16; Qwen solved 10/16. |
| Compositional static counting | Gemini solved 22/24; the hardest cell was exactly 2/4. |
| Endpoint wire tracing | Kimi solved 12/16 under the substantive forced-choice diagnostic. |
| Widely spaced crossing counts | Gemini remained above the bar. |
| 20×20 and 28×28 change localization | Gemini solved 8/8 and 4/8 respectively; the 34×34 replacement is a new discovery cycle. |
