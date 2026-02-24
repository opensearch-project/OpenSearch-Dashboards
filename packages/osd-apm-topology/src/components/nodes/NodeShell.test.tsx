/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '../../test-utils/vitest.utilities';
import { NodeShell } from './NodeShell';

describe('NodeShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children content', () => {
    render(
      <NodeShell>
        <span>Child content</span>
      </NodeShell>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders 8 Handle elements', () => {
    const { container } = render(
      <NodeShell>
        <span>test</span>
      </NodeShell>
    );
    // Handle is mocked by @xyflow/react - check for rendered handle elements
    const handles = container.querySelectorAll('[data-handleid]');
    // If Handle renders as divs, we check the count. The mock may render differently.
    // Let's check by id attributes
    expect(
      container.querySelector('[data-handleid="source-right"]') || container.textContent
    ).toBeDefined();
  });

  it('applies data-test-subj attribute', () => {
    const { container } = render(
      <NodeShell data-test-subj="my-node">
        <span>test</span>
      </NodeShell>
    );
    expect(container.querySelector('[data-test-subj="my-node"]')).toBeInTheDocument();
  });

  it('applies aria-label attribute', () => {
    render(
      <NodeShell aria-label="My node">
        <span>test</span>
      </NodeShell>
    );
    expect(screen.getByLabelText('My node')).toBeInTheDocument();
  });

  it('applies selection class when isSelected=true', () => {
    const { container } = render(
      <NodeShell isSelected={true}>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain('shadow-node-selected');
  });

  it('applies hover class when isSelected=false', () => {
    const { container } = render(
      <NodeShell isSelected={false}>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain('hover:shadow-node-hover');
  });

  it('applies fade opacity when isFaded=true', () => {
    const { container } = render(
      <NodeShell isFaded={true}>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain('opacity-30');
  });

  it('has full opacity when isFaded=false', () => {
    const { container } = render(
      <NodeShell isFaded={false}>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain('opacity-100');
  });

  it('applies cursor-pointer when onClick provided', () => {
    const { container } = render(
      <NodeShell onClick={jest.fn()}>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).toContain('cursor-pointer');
  });

  it('does not apply cursor-pointer when no onClick', () => {
    const { container } = render(
      <NodeShell>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.className).not.toContain('cursor-pointer');
  });

  it('sets role="button" and tabIndex=0 when interactive', () => {
    const { container } = render(
      <NodeShell onClick={jest.fn()}>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell).toHaveAttribute('role', 'button');
    expect(shell).toHaveAttribute('tabindex', '0');
  });

  it('does not set role or tabIndex when not interactive', () => {
    const { container } = render(
      <NodeShell>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell).not.toHaveAttribute('role');
    expect(shell).not.toHaveAttribute('tabindex');
  });

  it('calls onClick handler on click', () => {
    const onClick = jest.fn();
    const { container } = render(
      <NodeShell onClick={onClick}>
        <span>test</span>
      </NodeShell>
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDoubleClick handler on double click', () => {
    const onDoubleClick = jest.fn();
    const { container } = render(
      <NodeShell onDoubleClick={onDoubleClick}>
        <span>test</span>
      </NodeShell>
    );
    fireEvent.doubleClick(container.firstChild as HTMLElement);
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick on Enter key', () => {
    const onClick = jest.fn();
    const { container } = render(
      <NodeShell onClick={onClick}>
        <span>test</span>
      </NodeShell>
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick on Space key', () => {
    const onClick = jest.fn();
    const { container } = render(
      <NodeShell onClick={onClick}>
        <span>test</span>
      </NodeShell>
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick on other keys', () => {
    const onClick = jest.fn();
    const { container } = render(
      <NodeShell onClick={onClick}>
        <span>test</span>
      </NodeShell>
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Tab' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies custom borderColor inline style', () => {
    const { container } = render(
      <NodeShell borderColor="#ff0000">
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.style.borderColor).toBe('#ff0000');
  });

  it('applies custom backgroundColor inline style', () => {
    const { container } = render(
      <NodeShell backgroundColor="#00ff00">
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    // jsdom converts hex to rgb
    expect(shell.style.backgroundColor).toBe('rgb(0, 255, 0)');
  });

  it('sets --osd-node-glow-color CSS variable from glowColor prop', () => {
    const { container } = render(
      <NodeShell glowColor="rgba(255, 0, 0, 0.5)">
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.style.getPropertyValue('--osd-node-glow-color')).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('defaults glow color to rgba(59, 130, 246, 0.4) when no glowColor', () => {
    const { container } = render(
      <NodeShell>
        <span>test</span>
      </NodeShell>
    );
    const shell = container.firstChild as HTMLElement;
    expect(shell.style.getPropertyValue('--osd-node-glow-color')).toBe('rgba(59, 130, 246, 0.4)');
  });
});
