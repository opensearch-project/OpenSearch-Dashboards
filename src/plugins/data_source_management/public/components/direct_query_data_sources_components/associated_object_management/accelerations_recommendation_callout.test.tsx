/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccelerationsRecommendationCallout } from './accelerations_recommendation_callout';

describe('AccelerationsRecommendationCallout', () => {
  test('renders without crashing', () => {
    const { getByText } = render(<AccelerationsRecommendationCallout />);
    expect(
      getByText(
        'Accelerations recommended for tables. Setup acceleration or configure integrations'
      )
    ).toBeInTheDocument();
  });

  test('renders the correct title', () => {
    const { getByText } = render(<AccelerationsRecommendationCallout />);
    expect(
      getByText(
        'Accelerations recommended for tables. Setup acceleration or configure integrations'
      )
    ).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const { asFragment } = render(<AccelerationsRecommendationCallout />);
    expect(asFragment()).toMatchSnapshot();
  });
});
