/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { AgentTracesIcon } from './agent_traces_icon';

describe('<AgentTracesIcon />', () => {
  it('renders an SVG element', () => {
    const { container } = render(<AgentTracesIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses currentColor for fill', () => {
    const { container } = render(<AgentTracesIcon />);
    expect(container.querySelector('svg')?.getAttribute('fill')).toBe('currentColor');
  });

  it('passes through additional SVG props', () => {
    const { container } = render(<AgentTracesIcon data-test-subj="traceIcon" className="custom" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-test-subj')).toBe('traceIcon');
    expect(svg?.classList.contains('custom')).toBe(true);
  });
});
