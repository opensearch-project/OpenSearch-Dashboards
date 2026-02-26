/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Position } from '@xyflow/react';
import { CelestialEdge } from './celestial_edge';

const baseProps = {
  id: 'edge-1',
  source: 'node-1',
  target: 'node-2',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

describe('CelestialEdge', () => {
  it('renders wrapper <g> with class celEdge', () => {
    const { container } = render(<CelestialEdge {...baseProps} />);
    const g = container.querySelector('g.celEdge');
    expect(g).toBeTruthy();
  });

  it('uses default stroke color var(--osd-color-status-default)', () => {
    const { container } = render(<CelestialEdge {...baseProps} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.stroke).toBe('var(--osd-color-status-default)');
  });

  it('uses default strokeWidth of 2', () => {
    const { container } = render(<CelestialEdge {...baseProps} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.strokeWidth).toBe('2');
  });

  it('applies custom color as stroke', () => {
    const props = { ...baseProps, data: { style: { color: '#ff0000' } } };
    const { container } = render(<CelestialEdge {...props} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.stroke).toBe('#ff0000');
  });

  it('applies custom strokeWidth', () => {
    const props = { ...baseProps, data: { style: { strokeWidth: 5 } } };
    const { container } = render(<CelestialEdge {...props} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.strokeWidth).toBe('5');
  });

  it('sets strokeDasharray to "2 4" for dotted type', () => {
    const props = { ...baseProps, data: { style: { type: 'dotted' } } };
    const { container } = render(<CelestialEdge {...props} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.strokeDasharray).toBe('2 4');
  });

  it('sets strokeDasharray to "8 4" for dashed type', () => {
    const props = { ...baseProps, data: { style: { type: 'dashed' } } };
    const { container } = render(<CelestialEdge {...props} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.strokeDasharray).toBe('8 4');
  });

  it('sets strokeDasharray to "8 4" when dashed is true', () => {
    const props = { ...baseProps, data: { style: { dashed: true } } };
    const { container } = render(<CelestialEdge {...props} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.strokeDasharray).toBe('8 4');
  });

  it('has no strokeDasharray by default (solid)', () => {
    const { container } = render(<CelestialEdge {...baseProps} />);
    const path = container.querySelector('[data-test-subj="bezier-edge"]') as HTMLElement;
    expect(path.style.strokeDasharray).toBe('');
  });

  it('adds celEdge--flow class for animationType flow', () => {
    const props = { ...baseProps, data: { style: { animationType: 'flow' } } };
    const { container } = render(<CelestialEdge {...props} />);
    const g = container.querySelector('g');
    expect(g?.classList.contains('celEdge--flow')).toBe(true);
  });

  it('adds celEdge--pulse class for animationType pulse', () => {
    const props = { ...baseProps, data: { style: { animationType: 'pulse' } } };
    const { container } = render(<CelestialEdge {...props} />);
    const g = container.querySelector('g');
    expect(g?.classList.contains('celEdge--pulse')).toBe(true);
  });

  it('falls back to celEdge--flow when animated is true', () => {
    const props = { ...baseProps, data: { style: { animated: true } } };
    const { container } = render(<CelestialEdge {...props} />);
    const g = container.querySelector('g');
    expect(g?.classList.contains('celEdge--flow')).toBe(true);
  });

  it('has no animation class when no animation props set', () => {
    const { container } = render(<CelestialEdge {...baseProps} />);
    const g = container.querySelector('g');
    expect(g?.classList.contains('celEdge--flow')).toBe(false);
    expect(g?.classList.contains('celEdge--pulse')).toBe(false);
  });
});
