/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { OverviewCard } from './overview_card';
import React from 'react';

function renderOverviewCard() {
  return render(
    <OverviewCard
      title="Dev Tools"
      onClick={jest.fn()}
      description={'Dev tools description'}
      id="test-id"
    />
  );
}

describe('OverviewCard', () => {
  it('should render normally', () => {
    const { container, queryByText } = renderOverviewCard();
    expect(container.firstChild).toMatchSnapshot();
    expect(queryByText('Dev Tools')).not.toBeNull();
  });
});
