/**
 * Simple recursive tidy-tree layout for the fault tree SVG (section 8.2).
 * Leaves are spaced evenly, each parent is centred over its children,
 * and depth sets the y coordinate. Only nodes that have actually been
 * built (present in `visibleIds`) are laid out, so the tree can grow
 * as the student works through Pass 1.
 */

const NODE_WIDTH = 190;
const NODE_HEIGHT = 56;
const H_GAP = 24;
const V_GAP = 70;

/**
 * @typedef {Object} LaidOutNode
 * @property {string} id
 * @property {number} x       centre x
 * @property {number} y       centre y
 * @property {number} depth
 */

/**
 * @param {Object<string, import('../data/scenarios/site-down.js').default['faultTree']['nodes'][string]>} nodes
 * @param {string} rootId
 * @param {Set<string>} visibleIds   ids of nodes currently shown in the tree
 * @returns {{layout: Object<string, LaidOutNode>, width: number, height: number}}
 */
export function layoutTree(nodes, rootId, visibleIds) {
  const layout = {};
  let nextLeafX = 0;
  let maxDepth = 0;

  /**
   * @param {string} id
   * @param {number} depth
   * @returns {number} this node's centre x
   */
  function place(id, depth) {
    maxDepth = Math.max(maxDepth, depth);
    const node = nodes[id];
    const visibleChildren = (node?.children ?? []).filter((childId) => visibleIds.has(childId));

    let x;
    if (visibleChildren.length === 0) {
      x = nextLeafX * (NODE_WIDTH + H_GAP) + NODE_WIDTH / 2;
      nextLeafX += 1;
    } else {
      const childXs = visibleChildren.map((childId) => place(childId, depth + 1));
      x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    }

    layout[id] = { id, x, y: depth * (NODE_HEIGHT + V_GAP) + NODE_HEIGHT / 2, depth };
    return x;
  }

  if (visibleIds.has(rootId)) {
    place(rootId, 0);
  }

  const width = Math.max(NODE_WIDTH, nextLeafX * (NODE_WIDTH + H_GAP));
  const height = (maxDepth + 1) * (NODE_HEIGHT + V_GAP);
  return { layout, width, height, nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT };
}
