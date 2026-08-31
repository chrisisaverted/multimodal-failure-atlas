export function Shape({
  kind,
  fill,
  x,
  y,
  size,
}: {
  kind: string;
  fill: string;
  x: number;
  y: number;
  size: number;
}) {
  if (kind === "circle") return <circle cx={x} cy={y} r={size / 2} fill={fill} />;
  if (kind === "triangle")
    return (
      <path
        d={`M ${x} ${y - size / 2} L ${x + size / 2} ${y + size / 2} L ${x - size / 2} ${y + size / 2} Z`}
        fill={fill}
      />
    );
  if (kind === "diamond")
    return (
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        fill={fill}
        transform={`rotate(45 ${x} ${y})`}
      />
    );
  return <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={2} fill={fill} />;
}
