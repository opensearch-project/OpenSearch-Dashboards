/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PageWrapper } from './page_wrapper';

describe('PageWrapper', () => {
  it('should render normally', async () => {
    const { findByText, container } = render(<PageWrapper>Foo</PageWrapper>);
    await findByText('Foo');
    expect(container).toMatchSnapshot();
  });
});
