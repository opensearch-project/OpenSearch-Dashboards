/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import React, { ComponentProps, PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryAssistCallOut } from './call_outs';

type Props = ComponentProps<typeof QueryAssistCallOut>;

const IntlWrapper = ({ children }: PropsWithChildren<unknown>) => (
  <IntlProvider locale="en">{children}</IntlProvider>
);

const renderCallOut = (overrideProps: Partial<Props> = {}) => {
  const props: Props = Object.assign<Props, Partial<Props>>(
    {
      type: 'empty_query',
      language: 'test lang',
      onDismiss: jest.fn(),
    },
    overrideProps
  );
  const component = render(<QueryAssistCallOut {...props} />, {
    wrapper: IntlWrapper,
  });
  return { component, props: props as jest.MockedObjectDeep<Props> };
};

describe('CallOuts spec', () => {
  it('should display nothing if type is invalid', () => {
    // @ts-expect-error testing invalid type
    const { component } = renderCallOut({ type: '' });
    expect(component.container).toBeEmptyDOMElement();
  });

  it('should display empty_query call out', () => {
    const { component } = renderCallOut({ type: 'empty_query' });
    expect(component.container).toMatchSnapshot();
  });

  it('should display empty_index call out', () => {
    const { component } = renderCallOut({ type: 'empty_index' });
    expect(component.container).toMatchSnapshot();
  });

  it('should display invalid_query call out', () => {
    const { component } = renderCallOut({ type: 'invalid_query' });
    expect(component.container).toMatchSnapshot();
  });

  it('should display query_generated call out', () => {
    const { component } = renderCallOut({ type: 'query_generated' });
    expect(component.container).toMatchSnapshot();
  });
});
