/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocViewTableRowBtnCopy } from './table_row_btn_copy';

describe('DocViewTableRowBtnCopy', () => {
  it('renders copy value button', () => {
    render(<DocViewTableRowBtnCopy textToCopy="sample text" />);
    const button = screen.getByTestId('copyValueButton');
    expect(button).toBeInTheDocument();
  });
});
