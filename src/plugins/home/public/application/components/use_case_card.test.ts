/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIcon } from '@elastic/eui';
import { coreMock } from '../../../../../core/public/mocks';
import { registerUseCaseCard } from './use_case_card';
import { contentManagementPluginMocks } from '../../../../content_management/public';

describe('registerUseCaseCard', () => {
  const registerContentProviderFn = jest.fn();
  const contentManagementStartMock = {
    ...contentManagementPluginMocks.createStartContract(),
    registerContentProvider: registerContentProviderFn,
  };

  const core = coreMock.createStart();

  it('should register useCase card correctly', () => {
    registerUseCaseCard(contentManagementStartMock, core, {
      id: 'testId',
      order: 1,
      target: 'osd_homepage/get_started',
      icon: 'wsObservability',
      title: 'observability',
      description: 'Gain visibility into your application and infrastructure',
      navigateAppId: 'observability_overview',
    });

    expect(contentManagementStartMock.registerContentProvider).toHaveBeenCalledTimes(1);

    const registerCall = contentManagementStartMock.registerContentProvider.mock.calls[0][0];

    expect(registerCall.getTargetArea()).toEqual('osd_homepage/get_started');

    expect(registerCall.getContent()).toEqual({
      id: 'testId',
      kind: 'card',
      order: 1,
      description: 'Gain visibility into your application and infrastructure',
      title: 'observability',
      cardProps: {
        layout: 'horizontal',
      },
      onClick: expect.any(Function),
      getIcon: expect.any(Function),
    });

    const icon = registerCall.getContent().getIcon();
    expect(icon.type).toBe(EuiIcon);
    expect(icon.props).toEqual({
      size: 'l',
      color: 'subdued',
      type: 'wsObservability',
    });
  });

  it('should be able to navigate to the expected overview page when click the card', () => {
    const navigateToAppMock = jest.fn();
    core.application.navigateToApp = navigateToAppMock;

    registerUseCaseCard(contentManagementStartMock, core, {
      id: 'testId',
      order: 1,
      target: 'osd_homepage/get_started',
      icon: 'wsObservability',
      title: 'observability',
      description: 'Gain visibility into your application and infrastructure',
      navigateAppId: 'observability_overview',
    });

    const registerCall = contentManagementStartMock.registerContentProvider.mock.calls[0][0];
    const card = registerCall.getContent();
    card.onClick();
    expect(navigateToAppMock).toHaveBeenCalledWith('observability_overview');
  });
});
