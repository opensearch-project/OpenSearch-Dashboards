/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorCodeBlock, ErrorCodeBlockProps } from './error_code_block';

describe('ErrorCodeBlock', () => {
  const defaultProps: ErrorCodeBlockProps = {
    title: 'this is the title',
    text: 'This is the text',
  };

  const renderErrorCodeBlock = (props: Partial<ErrorCodeBlockProps> = {}) => {
    return render(<ErrorCodeBlock {...defaultProps} {...props} />);
  };

  describe('Component Rendering', () => {
    it('should render the component with title and text', () => {
      renderErrorCodeBlock();

      expect(screen.getByText('this is the title')).toBeInTheDocument();
      expect(screen.getByText('This is the text')).toBeInTheDocument();
    });
  });
});
