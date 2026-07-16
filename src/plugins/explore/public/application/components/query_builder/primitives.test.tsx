/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ControlGroup, RemoveButton, GhostAddButton, FieldPill } from './primitives';

describe('ControlGroup', () => {
  it('renders children, the floating label, and the data-test-subj', () => {
    render(
      <ControlGroup label="Group into" dataTestSubj="cg">
        <span>inner</span>
      </ControlGroup>
    );
    expect(screen.getByTestId('cg')).toBeInTheDocument();
    expect(screen.getByText('Group into')).toBeInTheDocument();
    expect(screen.getByText('inner')).toBeInTheDocument();
  });

  it('omits the label span when no label is provided', () => {
    render(
      <ControlGroup dataTestSubj="cg">
        <span>inner</span>
      </ControlGroup>
    );
    // The only child is the content; no floating label element rendered.
    expect(screen.getByTestId('cg').querySelector('.plqGroup__label')).toBeNull();
  });

  it('appends the extra className after plqGroup and applies style', () => {
    render(
      <ControlGroup className="extra" style={{ width: 42 }} dataTestSubj="cg">
        <span>inner</span>
      </ControlGroup>
    );
    const el = screen.getByTestId('cg');
    expect(el).toHaveClass('plqGroup');
    expect(el).toHaveClass('extra');
    expect(el).toHaveStyle({ width: '42px' });
  });
});

describe('RemoveButton', () => {
  it('fires onClick and exposes the aria-label', () => {
    const onClick = jest.fn();
    render(<RemoveButton onClick={onClick} ariaLabel="Remove sort" dataTestSubj="rm" />);
    const btn = screen.getByTestId('rm');
    expect(btn).toHaveAttribute('aria-label', 'Remove sort');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses the plqX class by default', () => {
    render(<RemoveButton onClick={jest.fn()} ariaLabel="x" dataTestSubj="rm" />);
    expect(screen.getByTestId('rm')).toHaveClass('plqX');
  });

  it('uses the plqPillX class for the chip variant', () => {
    render(<RemoveButton onClick={jest.fn()} ariaLabel="x" variant="chip" dataTestSubj="rm" />);
    expect(screen.getByTestId('rm')).toHaveClass('plqPillX');
  });
});

describe('GhostAddButton', () => {
  it('renders the label and fires onClick', () => {
    const onClick = jest.fn();
    render(<GhostAddButton label="Add sort" onClick={onClick} dataTestSubj="add" />);
    const btn = screen.getByTestId('add');
    expect(btn).toHaveTextContent('Add sort');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('FieldPill', () => {
  it('renders the label and removes via its chip ✕', () => {
    const onRemove = jest.fn();
    render(
      <FieldPill
        label="service"
        onRemove={onRemove}
        removeAriaLabel="Remove service"
        dataTestSubj="pill"
      />
    );
    expect(screen.getByTestId('pill')).toHaveTextContent('service');
    fireEvent.click(screen.getByLabelText('Remove service'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
