/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCodeBlock, EuiText } from '@elastic/eui';
import React from 'react';
import './error_code_block.scss';

export interface ErrorCodeBlockProps {
  title: string;
  text: string;
}

export const ErrorCodeBlock = ({ title, text }: ErrorCodeBlockProps) => {
  return (
    <div className="exploreErrorCodeBlock">
      <EuiText size="m">{title}</EuiText>
      <EuiCodeBlock isCopyable={true}>{text}</EuiCodeBlock>
    </div>
  );
};
