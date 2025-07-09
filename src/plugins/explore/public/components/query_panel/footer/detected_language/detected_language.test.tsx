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
  selectPromptModeIsAvailable: jest.fn(),
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

const renderWithStore = (editorMode: EditorMode, promptModeIsAvailable: boolean = true) => {
  const mockStore = createMockStore(editorMode);

  const {
    selectEditorMode,
    selectPromptModeIsAvailable,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require('../../../../application/utils/state_management/selectors');
  selectEditorMode.mockReturnValue(editorMode);
  selectPromptModeIsAvailable.mockReturnValue(promptModeIsAvailable);

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

  it('renders Natural Language and LanguageReference for SingleEmpty mode', () => {
    renderWithStore(EditorMode.SingleEmpty);

    const container = screen.getByTestId('exploreDetectedLanguage');
    expect(container).toHaveTextContent('Natural Language |');
    expect(screen.getByTestId('language-reference')).toBeInTheDocument();
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

  describe('when promptModeIsAvailable is false', () => {
    it('renders only LanguageReference for SingleEmpty mode when prompt mode not available', () => {
      renderWithStore(EditorMode.SingleEmpty, false);

      expect(screen.getByTestId('language-reference')).toBeInTheDocument();
      expect(screen.getByTestId('exploreDetectedLanguage')).not.toHaveTextContent(
        'Natural Language'
      );
    });

    it('renders only LanguageReference for SinglePrompt mode when prompt mode not available', () => {
      renderWithStore(EditorMode.SinglePrompt, false);

      expect(screen.getByTestId('language-reference')).toBeInTheDocument();
      expect(screen.getByTestId('exploreDetectedLanguage')).not.toHaveTextContent(
        'Natural Language'
      );
    });

    it('renders only LanguageReference for SingleQuery mode when prompt mode not available', () => {
      renderWithStore(EditorMode.SingleQuery, false);

      expect(screen.getByTestId('language-reference')).toBeInTheDocument();
      expect(screen.getByTestId('exploreDetectedLanguage')).not.toHaveTextContent(
        'Natural Language'
      );
    });

    it('renders only LanguageReference for DualPrompt mode when prompt mode not available', () => {
      renderWithStore(EditorMode.DualPrompt, false);

      expect(screen.getByTestId('language-reference')).toBeInTheDocument();
      expect(screen.getByTestId('exploreDetectedLanguage')).not.toHaveTextContent(
        'Natural Language'
      );
    });

    it('renders only LanguageReference for DualQuery mode when prompt mode not available', () => {
      renderWithStore(EditorMode.DualQuery, false);

      expect(screen.getByTestId('language-reference')).toBeInTheDocument();
      expect(screen.getByTestId('exploreDetectedLanguage')).not.toHaveTextContent(
        'Natural Language'
      );
    });
  });
});
