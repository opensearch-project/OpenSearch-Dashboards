/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIcon } from '@elastic/eui';
import { registerUseCaseCard } from './use_case_card';
import { contentManagementPluginMocks } from '../../../../content_management/public';

describe('registerUseCaseCard', () => {
  const registerContentProviderFn = jest.fn();
  const contentManagementStartMock = {
    ...contentManagementPluginMocks.createStartContract(),
    registerContentProvider: registerContentProviderFn,
  };

  it('should register useCase card correctly', () => {
    registerUseCaseCard(contentManagementStartMock, {
      id: 'testId',
      order: 1,
      target: 'osd_homepage/get_started',
      icon: 'wsObservability',
      title: 'observability',
      description: 'Gain visibility into your application and infrastructure',
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
});
