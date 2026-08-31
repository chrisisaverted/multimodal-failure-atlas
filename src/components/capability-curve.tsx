export function CapabilityCurve({
  color = "#f04b32",
  label = "Illustrative threshold",
}: {
  color?: string;
  label?: string;
}) {
  return (
    <figure className="curve-figure">
      <svg
        viewBox="0 0 560 240"
        role="img"
        aria-label="An illustrative capability curve showing accuracy improving with signal duration"
      >
        <g stroke="#171915" strokeOpacity=".13">
          <line x1="52" y1="25" x2="52" y2="196" />
          <line x1="52" y1="196" x2="535" y2="196" />
          <line x1="52" y1="111" x2="535" y2="111" strokeDasharray="4 6" />
        </g>
        <path
          d="M52 182 C120 181 142 172 181 157 C229 138 244 113 285 90 C328 66 381 48 535 37"
          fill="none"
          stroke={color}
          strokeWidth="4"
        />
        {[70, 139, 214, 285, 365, 450, 523].map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy={[180, 171, 143, 90, 62, 45, 38][i]}
            r="5"
            fill="#f1eee4"
            stroke={color}
            strokeWidth="3"
          />
        ))}
        <text x="12" y="32">
          100%
        </text>
        <text x="21" y="116">
          50%
        </text>
        <text x="27" y="200">
          0%
        </text>
        <text x="52" y="225">
          weaker signal
        </text>
        <text x="449" y="225">
          stronger signal
        </text>
      </svg>
      <figcaption>
        <span />
        {label} · real curves require preregistered model runs
      </figcaption>
    </figure>
  );
}
