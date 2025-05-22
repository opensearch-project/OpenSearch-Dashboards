/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { IMPORT_CHOICE_FILE, ImportTypeSelector } from './import_type_selector';

describe('ImportTypeSelector', () => {
  it('should render', () => {
    const { container } = render(
      <ImportTypeSelector updateSelection={jest.fn()} initialSelection={IMPORT_CHOICE_FILE} />
    );
    expect(container).toMatchSnapshot();
  });
});
