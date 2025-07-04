/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DetectedLanguage } from './detected_language';
import { EditorMode } from '../../../../application/utils/state_management/types';

jest.mock('./language_reference', () => ({
  LanguageReference: () => <span data-test-subj="language-reference">PPL Reference</span>,
}));
jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
}));

const createMockStore = (editorMode: EditorMode) => {
  return configureStore({
    reducer: {
      queryEditor: (state = { editorMode }) => state,
    },
    preloadedState: {
      queryEditor: { editorMode },
    },
  });
};

const renderWithStore = (editorMode: EditorMode) => {
  const mockStore = createMockStore(editorMode);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { selectEditorMode } = require('../../../../application/utils/state_management/selectors');
  selectEditorMode.mockReturnValue(editorMode);

  return render(
    <Provider store={mockStore}>
      <DetectedLanguage />
    </Provider>
  );
};

describe('DetectedLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Natural Language text for SinglePrompt mode', () => {
    renderWithStore(EditorMode.SinglePrompt);

    expect(screen.getByTestId('exploreDetectedLanguage')).toHaveTextContent('Natural Language');
    expect(screen.queryByTestId('language-reference')).not.toBeInTheDocument();
  });

  it('renders only LanguageReference for SingleQuery mode', () => {
    renderWithStore(EditorMode.SingleQuery);

    expect(screen.getByTestId('language-reference')).toBeInTheDocument();
    expect(screen.getByTestId('exploreDetectedLanguage')).not.toHaveTextContent('Natural Language');
  });

  it('renders Natural Language and LanguageReference for DualPrompt mode', () => {
    renderWithStore(EditorMode.DualPrompt);

    const container = screen.getByTestId('exploreDetectedLanguage');
    expect(container).toHaveTextContent('Natural Language |');
    expect(screen.getByTestId('language-reference')).toBeInTheDocument();
  });

  it('renders Natural Language and LanguageReference for DualQuery mode', () => {
    renderWithStore(EditorMode.DualQuery);

    const container = screen.getByTestId('exploreDetectedLanguage');
    expect(container).toHaveTextContent('Natural Language |');
    expect(screen.getByTestId('language-reference')).toBeInTheDocument();
  });

  it('throws error for unsupported editor mode', () => {
    // eslint-disable-next-line no-console
    const originalError = console.error;
    // eslint-disable-next-line no-console
    console.error = jest.fn();

    expect(() => {
      renderWithStore('unsupported-mode' as EditorMode);
    }).toThrow('DetectedLanguage encountered unsupported editorMode: unsupported-mode');

    // eslint-disable-next-line no-console
    console.error = originalError;
  });
});
