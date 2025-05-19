/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ImportFileContentBody } from './import_file_content';
import { DEFAULT_SUPPORTED_FILE_TYPES_LIST } from '../../common';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-id'),
}));

describe('ImportFileContent', () => {
  it('should render', () => {
    const { container } = render(
      <ImportFileContentBody
        enabledFileTypes={DEFAULT_SUPPORTED_FILE_TYPES_LIST}
        onFileUpdate={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
