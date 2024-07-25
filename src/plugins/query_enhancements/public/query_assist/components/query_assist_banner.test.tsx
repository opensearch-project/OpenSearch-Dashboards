/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import { fireEvent, render } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { QueryAssistBanner } from './query_assist_banner';

jest.mock('../../services', () => ({
  getStorage: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
}));

type QueryAssistBannerProps = ComponentProps<typeof QueryAssistBanner>;

const renderQueryAssistBanner = (overrideProps: Partial<QueryAssistBannerProps> = {}) => {
  const props: QueryAssistBannerProps = Object.assign<
    QueryAssistBannerProps,
    Partial<QueryAssistBannerProps>
  >(
    {
      languages: ['test-lang1', 'test-lang2'],
      dependencies: {
        language: 'default',
        onSelectLanguage: jest.fn(),
        isCollapsed: true,
        setIsCollapsed: jest.fn(),
      },
    },
    overrideProps
  );
  const component = render(
    <I18nProvider>
      <QueryAssistBanner {...props} />
    </I18nProvider>
  );
  return { component, props: props as jest.MockedObjectDeep<QueryAssistBannerProps> };
};

describe('<QueryAssistBanner /> spec', () => {
  it('should dismiss callout', async () => {
    const { component } = renderQueryAssistBanner();
    expect(
      component.getByText('Natural Language Query Generation for test-lang1, test-lang2')
    ).toBeInTheDocument();

    fireEvent.click(component.getByTestId('closeCallOutButton'));
    expect(
      component.queryByText('Natural Language Query Generation for test-lang1, test-lang2')
    ).toBeNull();
  });

  it('should change language', async () => {
    const { props, component } = renderQueryAssistBanner();

    fireEvent.click(component.getByTestId('queryAssist-banner-changeLanguage'));
    expect(props.dependencies.onSelectLanguage).toBeCalledWith('test-lang1');
    expect(props.dependencies.setIsCollapsed).toBeCalledWith(false);
  });
});
