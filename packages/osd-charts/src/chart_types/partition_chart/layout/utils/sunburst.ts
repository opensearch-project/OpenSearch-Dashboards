import { ArrayEntry, childrenAccessor, HierarchyOfArrays } from './group_by_rollup';
import { Origin, Part } from '../types/types';

export function sunburst(
  nodes: HierarchyOfArrays,
  areaAccessor: (e: ArrayEntry) => number,
  { x0, y0 }: Origin,
  clockwiseSectors: boolean,
  specialFirstInnermostSector: boolean,
): Array<Part> {
  const result: Array<Part> = [];
  const laySubtree = (nodes: HierarchyOfArrays, { x0, y0 }: Origin, depth: number) => {
    let currentOffsetX = x0;
    const nodeCount = nodes.length;
    for (let i = 0; i < nodeCount; i++) {
      const index = clockwiseSectors ? i : nodeCount - i - 1;
      const node = nodes[depth === 1 && specialFirstInnermostSector ? (index + 1) % nodeCount : index];
      const area = areaAccessor(node);
      result.push({ node, x0: currentOffsetX, y0, x1: currentOffsetX + area, y1: y0 + 1 });
      const children = childrenAccessor(node);
      if (children && children.length) {
        laySubtree(children, { x0: currentOffsetX, y0: y0 + 1 }, depth + 1);
      }
      currentOffsetX += area;
    }
  };
  laySubtree(nodes, { x0, y0 }, 0);
  return result;
}
