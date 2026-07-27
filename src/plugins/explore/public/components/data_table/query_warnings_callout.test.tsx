/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryWarningsCallout } from './query_warnings_callout';

describe('QueryWarningsCallout', () => {
  it('renders nothing when there are no warnings', () => {
    const { container } = render(<QueryWarningsCallout warnings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a warning with its message and detail', () => {
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

    expect(screen.getByTestId('queryWarningsCallout')).toBeInTheDocument();
    expect(
      screen.getByText('Results exclude 1 of 2 indices due to a mapping conflict.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Field \[env\] is mapped inconsistently\. Excluded indices: \[logs-text\]\./)
    ).toBeInTheDocument();
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
