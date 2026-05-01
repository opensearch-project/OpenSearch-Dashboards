/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { AgentSpansIcon } from './agent_spans_icon';

describe('<AgentSpansIcon />', () => {
  it('renders an SVG element', () => {
    const { container } = render(<AgentSpansIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses currentColor for fill', () => {
    const { container } = render(<AgentSpansIcon />);
    expect(container.querySelector('svg')?.getAttribute('fill')).toBe('currentColor');
  });

  it('passes through additional SVG props', () => {
    const { container } = render(<AgentSpansIcon data-test-subj="spansIcon" className="custom" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-test-subj')).toBe('spansIcon');
    expect(svg?.classList.contains('custom')).toBe(true);
  });
});
