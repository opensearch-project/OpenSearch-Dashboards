/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { DelimiterSelect } from './delimiter_select';

describe('DelimiterSelect', () => {
  it('should render', () => {
    const { container } = render(
      <DelimiterSelect onDelimiterChange={jest.fn()} initialDelimiter=";" />
    );
    expect(container).toMatchSnapshot();
  });
});
