/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '@testing-library/react';
import { FaultsLabel } from './faults_label';
// Mock the FaultsSwatch component
jest.mock('../swatches/faults_swatch', () => ({
  FaultsSwatch: () => <div data-test-subj="mock-faults-swatch" />,
}));

describe('FaultsLabel', () => {
  it('renders with text and default swatch', () => {
    render(<FaultsLabel text="Faults" />);

    expect(screen.getByText('Faults')).toBeInTheDocument();
    expect(screen.getByTestId('mock-faults-swatch')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(
      <FaultsLabel text="Faults">
        <div data-test-subj="custom-child">Custom Child</div>
      </FaultsLabel>
    );

    expect(screen.getByText('Faults')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-faults-swatch')).not.toBeInTheDocument();
  });
});
