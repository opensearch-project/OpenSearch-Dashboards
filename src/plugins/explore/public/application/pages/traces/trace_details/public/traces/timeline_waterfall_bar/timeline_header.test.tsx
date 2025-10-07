/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TimelineHeader } from './timeline_header';

jest.mock('./timeline_ruler', () => ({
  TimelineRuler: jest.fn(() => <div data-test-subj="timeline-ruler" />),
}));

describe('TimelineHeader', () => {
  const mockProps = {
    traceTimeRange: {
      durationMs: 1000,
      startTimeMs: 0,
      endTimeMs: 1000,
    },
  };

  it('should render timeline text and TimelineRuler component', () => {
    const { getByText, getByTestId } = render(<TimelineHeader {...mockProps} />);

    expect(getByText('Timeline')).toBeInTheDocument();
    expect(getByTestId('timeline-ruler')).toBeInTheDocument();
  });
});
