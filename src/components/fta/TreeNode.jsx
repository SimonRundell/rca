/**
 * One SVG box for a fault tree node. Geometry (x, y, width, height) is
 * computed layout, not styling, so it is passed as plain SVG attributes
 * rather than through the stylesheet (section 3.1's one exception).
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {number} props.x   centre x
 * @param {number} props.y   centre y
 * @param {number} props.width
 * @param {number} props.height
 * @param {'confirmed'|'ruledOut'|'unknown'|null} [props.verdict]
 * @param {boolean} [props.isTop]
 */
export function TreeNode({ label, x, y, width, height, verdict, isTop }) {
  const left = x - width / 2;
  const top = y - height / 2;
  const stateClass = verdict ? `tree-node--${verdict}` : '';

  return (
    <g className={`tree-node ${stateClass}${isTop ? ' tree-node--top' : ''}`}>
      <rect x={left} y={top} width={width} height={height} rx={8} className="tree-node__box" />
      <foreignObject x={left + 6} y={top + 4} width={width - 12} height={height - 8}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="tree-node__label">
          {label}
        </div>
      </foreignObject>
    </g>
  );
}
