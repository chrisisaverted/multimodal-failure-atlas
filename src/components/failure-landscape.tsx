import Link from "next/link";
import { orderByUniversalHardness, easiestRouteRate, weakestControlRate } from "@/lib/admitted-analysis";
import type { AdmittedFamilyEvidence } from "@/lib/admitted-evidence";
import { failureModesById } from "@/lib/catalogue";

const width = 900;
const height = 540;
const margin = { top: 35, right: 30, bottom: 76, left: 78 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
const x = (rate: number) => margin.left + (rate / 0.5) * plotWidth;
const y = (rate: number) => margin.top + (1 - rate) * plotHeight;
const percent = (rate: number) => `${Math.round(rate * 100)}%`;

export function FailureLandscape({ families }: { families: AdmittedFamilyEvidence[] }) {
  const ordered = orderByUniversalHardness(families);
  return (
    <figure className="failure-landscape">
      <figcaption>
        <div>
          <p className="eyebrow">Two meanings of a strong result</p>
          <h2>Hard for every route. Recoverable under control.</h2>
        </div>
        <div className="landscape-legend" aria-label="Modality legend">
          <span>
            <i className="image" /> Image
          </span>
          <span>
            <i className="video" /> Video
          </span>
        </div>
      </figcaption>
      <div className="landscape-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="landscape-title landscape-desc">
          <title id="landscape-title">Universal hardness versus weakest control recovery</title>
          <desc id="landscape-desc">
            Twenty admitted families across five current routes. Points farther left have lower accuracy on
            their easiest model route. Points higher up have better accuracy on their weakest control route.
          </desc>
          <rect
            className="landscape-frame"
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
          />
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={`y-${tick}`}>
              <line
                className="landscape-grid"
                x1={margin.left}
                x2={width - margin.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="landscape-tick" x={margin.left - 13} y={y(tick) + 4} textAnchor="end">
                {percent(tick)}
              </text>
            </g>
          ))}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((tick) => (
            <g key={`x-${tick}`}>
              <line
                className="landscape-grid"
                x1={x(tick)}
                x2={x(tick)}
                y1={margin.top}
                y2={height - margin.bottom}
              />
              <text
                className="landscape-tick"
                x={x(tick)}
                y={height - margin.bottom + 24}
                textAnchor="middle"
              >
                {percent(tick)}
              </text>
            </g>
          ))}
          <line
            className="landscape-guide"
            x1={margin.left}
            x2={width - margin.right}
            y1={y(0.75)}
            y2={y(0.75)}
          />
          <text
            className="landscape-guide-label"
            x={width - margin.right - 8}
            y={y(0.75) - 8}
            textAnchor="end"
          >
            75% control guide
          </text>
          <text
            className="landscape-axis-title"
            x={margin.left + plotWidth / 2}
            y={height - 15}
            textAnchor="middle"
          >
            Easiest native route accuracy · lower is universally harder
          </text>
          <text
            className="landscape-axis-title"
            x={18}
            y={margin.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 18 ${margin.top + plotHeight / 2})`}
          >
            Weakest control accuracy · higher is cleaner recovery
          </text>
          {ordered.map((family, index) => {
            const native = easiestRouteRate(family);
            const control = weakestControlRate(family);
            if (native === null || control === null) return null;
            const mode = failureModesById.get(family.catalogueId);
            return (
              <Link
                key={family.catalogueId}
                href={`/failure/${family.catalogueId}`}
                aria-label={`${index + 1}. ${mode?.title ?? family.catalogueId}: easiest route ${percent(native)}, weakest control ${percent(control)}`}
              >
                <circle
                  className={`landscape-point ${family.modality}`}
                  cx={x(native)}
                  cy={y(control)}
                  r="13"
                />
                <text className="landscape-point-label" x={x(native)} y={y(control) + 4} textAnchor="middle">
                  {index + 1}
                </text>
              </Link>
            );
          })}
        </svg>
      </div>
      <p>
        Top-left is the most diagnostic region. The 75% line is a visual guide, not an admission threshold;
        controls affect attribution, never whether a native failure counts.
      </p>
    </figure>
  );
}
