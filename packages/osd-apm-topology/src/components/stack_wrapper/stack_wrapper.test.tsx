/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StackWrapper } from './stack_wrapper';

const baseProps = {
  hiddenChildrenCount: 3,
  isFaded: false,
};

describe('StackWrapper', () => {
  it('renders children content', () => {
    render(
      <StackWrapper {...baseProps}>
        <div>Hello</div>
      </StackWrapper>
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders stack layers behind content', () => {
    const { container } = render(
      <StackWrapper {...baseProps}>
        <div>Content</div>
      </StackWrapper>
    );
    const hiddenLayers = container.querySelectorAll('[aria-hidden="true"]');
    // Default maxVisibleStacks is 2
    expect(hiddenLayers.length).toBe(2);
  });

  it('shows "+N" badge with correct hidden count', () => {
    render(
      <StackWrapper {...baseProps} hiddenChildrenCount={5}>
        <div>Content</div>
      </StackWrapper>
    );
    expect(screen.getByText('+5')).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('respects maxVisibleStacks limit', () => {
    const { container } = render(
      <StackWrapper {...baseProps} maxVisibleStacks={4}>
        <div>Content</div>
      </StackWrapper>
    );
    const hiddenLayers = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenLayers.length).toBe(4);
  });

  it('renders action button when provided', () => {
    render(
      <StackWrapper {...baseProps} button={<button>Expand</button>}>
        <div>Content</div>
      </StackWrapper>
    );
    expect(screen.getByText('Expand')).toBeTruthy();
  });

  it('applies fade opacity when isFaded is true', () => {
    const { container } = render(
      <StackWrapper {...baseProps} isFaded={true}>
        <div>Content</div>
      </StackWrapper>
    );
    const stackLayers = container.querySelectorAll('[aria-hidden="true"]');
    stackLayers.forEach((layer) => {
      expect((layer as HTMLElement).style.opacity).toBe('0.3');
    });
  });

  it('does not apply fade opacity when isFaded is false', () => {
    const { container } = render(
      <StackWrapper {...baseProps} isFaded={false}>
        <div>Content</div>
      </StackWrapper>
    );
    const stackLayers = container.querySelectorAll('[aria-hidden="true"]');
    stackLayers.forEach((layer) => {
      expect((layer as HTMLElement).style.opacity).toBe('1');
    });
  });
});
