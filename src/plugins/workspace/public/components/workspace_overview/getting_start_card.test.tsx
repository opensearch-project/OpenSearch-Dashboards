/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { WorkspaceOverviewCard } from './getting_start_card';
import { coreMock } from '../../../../../core/public/mocks';
import { DEFAULT_APP_CATEGORIES } from '../../../../../core/public';
import { GetStartCard } from './types';

describe('WorkspaceOverviewCard', () => {
  const featureName = 'Visualizations';
  const featureDescription = 'this is a description';
  const card = {
    id: 'visualize',
    featureDescription,
    featureName,
    link: '/app/visualize',
    category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
  };
  const mockCoreStart = coreMock.createStart();
  const renderWorkspaceCard = (_card: GetStartCard) => {
    return (
      <WorkspaceOverviewCard
        card={_card}
        workspaceId="test"
        basePath={mockCoreStart.http.basePath}
        application={mockCoreStart.application}
      />
    );
  };

  it('render getting start card normally', async () => {
    const { container } = render(renderWorkspaceCard(card));
    expect(container).toHaveTextContent(`with Visualizations`);
    expect(container).toHaveTextContent(featureDescription);
  });

  it('click on card will navigate to related URL', async () => {
    const { getByTestId } = render(renderWorkspaceCard(card));
    fireEvent.click(getByTestId(featureName));
    expect(mockCoreStart.application.getUrlForApp).not.toHaveBeenCalled();
    expect(mockCoreStart.application.navigateToUrl).toHaveBeenCalledWith(
      'http://localhost/w/test/app/visualize'
    );
  });

  it('click on card will navigate to specified app if no link provided', async () => {
    const { getByTestId } = render(renderWorkspaceCard({ ...card, link: undefined }));
    fireEvent.click(getByTestId(featureName));
    expect(mockCoreStart.application.getUrlForApp).toHaveBeenCalledWith('visualize');
    expect(mockCoreStart.application.navigateToUrl).toHaveBeenCalledWith(
      'http://localhost/w/test/app/visualize'
    );
  });
});
