# Hosting decision

## Recommendation

The public research preview is deployed to **GitHub Pages** at
`https://chrisisaverted.github.io/multimodal-failure-atlas/`, without a purchased domain.

The application exports to static files, so Pages provides zero-cost hosting without a server-side
secret surface. If the project later needs authenticated contributions or queued evaluation jobs,
add a separate service only after an explicit operational review.

Keep paid model evaluation out of unrestricted public request handlers. Run controlled evaluation batches locally or in an explicitly budgeted job, append verified result artifacts, and let the public site read cached results.

## Why static-first

- The complete catalogue and all current exhibit pages prerender.
- Public generators run in the visitor’s browser.
- No database or object store is required for the preview.
- No API credential reaches the browser.
- A traffic spike cannot create model-API spend.

## Deployment

GitHub Actions installs dependencies, runs the static production build with the repository base
path, and deploys the exported artifact to Pages. Model credentials are never configured in the
public deployment; evaluated records and media are committed immutable artifacts.

Do not set model credentials for the public preview. If server-side evaluations are later deployed, require authentication, queues, per-user quotas, global daily spend limits, and an immutable append-only result store.

## Scale-up path

1. **Preview:** Vercel free tier; generated media committed under strict size limits; $0 expected hosting.
2. **Growing atlas:** move large media to an object store with CDN; retain immutable checksums in the repository.
3. **Evaluation service:** separate worker and queue from the public frontend; authenticated admin submission only.
4. **Public live requests:** only after prepaid quotas, abuse controls, and a bounded daily budget exist.

Pricing and free-tier terms can change. Verify official pricing immediately before any purchase or production migration.

## Alternatives considered

- **Cloudflare Pages/Workers:** compelling static economics—[static asset requests are free and unlimited](https://developers.cloudflare.com/pages/functions/pricing/) and the free Pages plan currently allows [500 builds/month and 20,000 files](https://developers.cloudflare.com/pages/platform/limits/). It adds adapter and deployment work for this native Next.js codebase, so it is the scale-up alternative rather than the first release.
- **GitHub Pages:** adequate for a pure static export, but has a [1 GB site recommendation, 100 GB/month soft bandwidth limit, and no server runtime](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). It would narrow the future contribution and evidence-review workflow.
