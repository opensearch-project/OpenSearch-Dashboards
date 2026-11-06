/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CelestialEdge, CelestialNode } from '../../types';
import { layoutOptionsKey, layoutSignature, reuseLayout } from './layout_reuse.utils';

const node = (id: string, extra: Partial<CelestialNode> = {}): CelestialNode =>
  ({
    id,
    type: 'celestial',
    position: { x: 0, y: 0 },
    data: { id, title: id, keyAttributes: {} },
    ...extra,
  }) as CelestialNode;
const edge = (id: string, source: string, target: string, extra: Partial<CelestialEdge> = {}) =>
  ({ id, source, target, ...extra }) as CelestialEdge;

describe('layoutSignature', () => {
  const nodes = [node('a'), node('b')];
  const edges = [edge('e1', 'a', 'b')];

  it('ignores node data', () => {
    const updated = nodes.map((n) => ({ ...n, data: { ...n.data, title: 'new', metrics: 1 } }));
    expect(layoutSignature(updated as CelestialNode[], edges)).toBe(layoutSignature(nodes, edges));
  });

  it('changes with any layout input', () => {
    const base = layoutSignature(nodes, edges);
    expect(layoutSignature([nodes[1], nodes[0]], edges)).not.toBe(base);
    expect(layoutSignature([nodes[0], { ...nodes[1], hidden: true }], edges)).not.toBe(base);
    expect(layoutSignature([nodes[0], { ...nodes[1], width: 400 }], edges)).not.toBe(base);
    expect(layoutSignature([nodes[0], { ...nodes[1], parentId: 'a' }], edges)).not.toBe(base);
    expect(layoutSignature([...nodes, node('c')], edges)).not.toBe(base);
    expect(layoutSignature(nodes, [])).not.toBe(base);
    expect(layoutSignature(nodes, [edge('e1', 'b', 'a')])).not.toBe(base);
    expect(layoutSignature(nodes, [{ ...edges[0], hidden: true }])).not.toBe(base);
  });
});

describe('reuseLayout', () => {
  it('keeps positions, container sizes and edge handles, and takes everything else anew', () => {
    const previous = {
      nodes: [
        node('p', {
          position: { x: 5, y: 6 },
          width: 300,
          height: 200,
          style: { width: '300px', height: '200px' },
        }),
        node('a', { position: { x: 10, y: 20 }, parentId: 'p' }),
      ],
      edges: [edge('e1', 'a', 'p', { sourceHandle: 'source-right', targetHandle: 'target-left' })],
    };
    const next = reuseLayout(
      previous,
      [
        node('p', { style: { opacity: 0.5 } }),
        node('a', { parentId: 'p', data: { id: 'a', title: 'updated', keyAttributes: {} } }),
      ],
      [edge('e1', 'a', 'p', { selected: true })]
    );

    expect(next.nodes[0]).toMatchObject({
      position: { x: 5, y: 6 },
      width: 300,
      height: 200,
      style: { opacity: 0.5, width: '300px', height: '200px' },
    });
    expect(next.nodes[1]).toMatchObject({ position: { x: 10, y: 20 }, data: { title: 'updated' } });
    expect(next.edges[0]).toMatchObject({
      selected: true,
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
    });
  });

  it('leaves elements the previous layout did not have unchanged', () => {
    const fresh = node('z');
    expect(reuseLayout({ nodes: [], edges: [] }, [fresh], []).nodes[0]).toBe(fresh);
  });
});

describe('reuseLayout order and container sizes', () => {
  it("keeps the previous result's order (parents before children)", () => {
    const previous = {
      nodes: [node('p', { width: 300, height: 200 }), node('a', { parentId: 'p' })],
      edges: [],
    };
    const next = reuseLayout(previous, [node('a', { parentId: 'p' }), node('p')], []);
    expect(next.nodes.map((n) => n.id)).toEqual(['p', 'a']);
  });

  it('copies a container height the layout changed even when the width is the same', () => {
    const previous = {
      nodes: [node('p', { width: 272, height: 420, style: { width: '272px', height: '420px' } })],
      edges: [],
    };
    const next = reuseLayout(previous, [node('p', { width: 272, height: 156 })], []);
    expect(next.nodes[0]).toMatchObject({
      width: 272,
      height: 420,
      style: { width: '272px', height: '420px' },
    });
  });
});

describe('layoutOptionsKey', () => {
  it('compares options by value, in any key order', () => {
    expect(layoutOptionsKey({ direction: 'TB', rankSeparation: 80 })).toBe(
      layoutOptionsKey({ rankSeparation: 80, direction: 'TB' })
    );
    expect(layoutOptionsKey({ direction: 'TB' })).not.toBe(layoutOptionsKey({ direction: 'LR' }));
    expect(layoutOptionsKey(undefined)).toBe('');
  });
});
