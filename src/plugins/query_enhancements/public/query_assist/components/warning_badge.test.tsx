/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, waitFor } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { WarningBadge } from './warning_badge';

type WarningBadgeProps = ComponentProps<typeof WarningBadge>;

const renderWarningBadge = (overrideProps: Partial<WarningBadgeProps> = {}) => {
  const props: WarningBadgeProps = Object.assign<WarningBadgeProps, Partial<WarningBadgeProps>>(
    {
      error: {
        error: {
          error: {
            details: 'mock-details',
            reason: 'mock-reason',
            type: 'mock-type',
          },
          status: 303,
        },
        name: 'mock-name',
        message: 'mock-message',
      },
    },
    overrideProps
  );
  const component = render(
    <IntlProvider locale="en">
      <WarningBadge {...props} />
    </IntlProvider>
  );
  return { component, props: props as jest.MockedObjectDeep<WarningBadgeProps> };
};

describe('<WarningBadge /> spec', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render null if no error', () => {
    const { component } = renderWarningBadge({ error: undefined });
    expect(component.container).toBeEmptyDOMElement();
  });

  it('should render error details', async () => {
    const { component } = renderWarningBadge();

    fireEvent.click(component.getByTestId('queryAssistErrorBadge'));
    await waitFor(() => {
      expect(component.getByText(/mock-reason/)).toBeInTheDocument();
    });

    fireEvent.click(component.getByTestId('queryAssistErrorMore'));
    await waitFor(() => {
      expect(component.getByText(/mock-details/)).toBeInTheDocument();
    });
  });
});
