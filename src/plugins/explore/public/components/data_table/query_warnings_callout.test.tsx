/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryWarningsCallout } from './query_warnings_callout';

describe('QueryWarningsCallout', () => {
  it('renders nothing when there are no warnings', () => {
    const { container } = render(<QueryWarningsCallout warnings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the message and reveals the detail only after clicking Show more', () => {
    render(
      <QueryWarningsCallout
        warnings={[
          {
            type: 'PARTIAL_RESULT',
            message: 'Results exclude 1 of 2 indices due to a mapping conflict.',
            detail: 'Field [env] is mapped inconsistently. Excluded indices: [logs-text].',
          },
        ]}
      />
    );

    // The callout carries an explicit "Partial results" title, and the short message is always
    // visible.
    expect(screen.getByTestId('queryWarningsCallout')).toBeInTheDocument();
    expect(screen.getByText('Partial results')).toBeInTheDocument();
    expect(
      screen.getByText('Results exclude 1 of 2 indices due to a mapping conflict.')
    ).toBeInTheDocument();

    // The long detail is collapsed behind "Show more".
    const detailMatcher =
      /Field \[env\] is mapped inconsistently\. Excluded indices: \[logs-text\]\./;
    expect(screen.queryByText(detailMatcher)).not.toBeInTheDocument();

    // Expand -> detail visible, toggle flips to "Show less".
    fireEvent.click(screen.getByTestId('queryWarningsToggle'));
    expect(screen.getByText(detailMatcher)).toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();

    // Collapse again -> detail hidden.
    fireEvent.click(screen.getByTestId('queryWarningsToggle'));
    expect(screen.queryByText(detailMatcher)).not.toBeInTheDocument();
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('does not render a toggle when the warning has no detail', () => {
    render(
      <QueryWarningsCallout warnings={[{ type: 'PARTIAL_RESULT', message: 'No detail here.' }]} />
    );
    expect(screen.getByText('No detail here.')).toBeInTheDocument();
    expect(screen.queryByTestId('queryWarningsToggle')).not.toBeInTheDocument();
  });

  it('offers a rerun action on a partial result and invokes it when clicked', () => {
    const onRerun = jest.fn();
    render(
      <QueryWarningsCallout
        warnings={[{ type: 'PARTIAL_RESULT', message: 'Partial.' }]}
        onRerunWithoutPartialResults={onRerun}
      />
    );

    const rerun = screen.getByTestId('queryWarningsRerunWithoutPartial');
    expect(rerun).toBeInTheDocument();
    fireEvent.click(rerun);
    expect(onRerun).toHaveBeenCalledTimes(1);
  });

  it('hides the rerun action when no handler is supplied', () => {
    render(<QueryWarningsCallout warnings={[{ type: 'PARTIAL_RESULT', message: 'Partial.' }]} />);
    expect(screen.queryByTestId('queryWarningsRerunWithoutPartial')).not.toBeInTheDocument();
  });

  it('hides the rerun action for warnings that are not partial results', () => {
    render(
      <QueryWarningsCallout
        warnings={[{ type: 'SOMETHING_ELSE', message: 'Unrelated notice.' }]}
        onRerunWithoutPartialResults={jest.fn()}
      />
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.queryByTestId('queryWarningsRerunWithoutPartial')).not.toBeInTheDocument();
  });

  it('renders one callout per warning', () => {
    render(
      <QueryWarningsCallout
        warnings={[
          { type: 'PARTIAL_RESULT', message: 'First warning.' },
          { type: 'PARTIAL_RESULT', message: 'Second warning.' },
        ]}
      />
    );

    expect(screen.getAllByTestId('queryWarningsCallout')).toHaveLength(2);
  });
});
