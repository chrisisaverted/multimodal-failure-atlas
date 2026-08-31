# Hosting decision

## Recommendation

Deploy the public research preview to **Vercel’s free tier** initially, without a purchased domain. This is the lowest-friction match for the Next.js application and supports static pages plus small server routes if later needed.

As checked on 2026-08-30, Vercel lists Hobby at [$0/month](https://vercel.com/pricing), with 1 million edge requests and 100 GB transfer included per month; its terms describe Hobby as personal, non-commercial use. That fits an independent research preview. If the project becomes institutional or commercial, move to Pro only after explicit spending approval.

Keep paid model evaluation out of unrestricted public request handlers. Run controlled evaluation batches locally or in an explicitly budgeted job, append verified result artifacts, and let the public site read cached results.

## Why static-first

- The complete catalogue and all current exhibit pages prerender.
- Public generators run in the visitor’s browser.
- No database or object store is required for the preview.
- No API credential reaches the browser.
- A traffic spike cannot create model-API spend.

## Deployment

No deployment was performed because no external account or public-posting authorization was provided. A deploy can be created later by importing the repository into Vercel and using the default Next.js build settings:

```text
Install: npm install
Build:   npm run build
Output:  managed by Next.js adapter
```

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
