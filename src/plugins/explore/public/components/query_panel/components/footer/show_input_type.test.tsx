/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ShowInputType } from './show_input_type';
import { EditorLanguage } from '../../types';

describe('ShowInputType', () => {
  it('shows Natural Language for nl', () => {
    render(
      <ShowInputType languageType={EditorLanguage.Natural} isDualEditor={false} noInput={false} />
    );
    expect(screen.getByText(/Natural Language/)).toBeInTheDocument();
  });

  it('shows Natural Language | PPL for dual editor', () => {
    render(
      <ShowInputType languageType={EditorLanguage.Natural} isDualEditor={true} noInput={false} />
    );
    expect(screen.getByText(/Natural Language \| PPL/)).toBeInTheDocument();
  });

  it('shows PPL for other language types', () => {
    render(<ShowInputType languageType={EditorLanguage.PPL} isDualEditor={false} noInput={false} />);
    expect(screen.getByText('PPL')).toBeInTheDocument();
  });

  it('renders nothing if noInput is true', () => {
    render(
      <ShowInputType languageType={EditorLanguage.Natural} isDualEditor={false} noInput={true} />
    );
    expect(screen.queryByText(/Natural Language/)).toBeNull();
  });
});
