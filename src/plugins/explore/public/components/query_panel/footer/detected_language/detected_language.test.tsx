/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { DetectedLanguage, getLanguageReference } from './detected_language';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../../../../application/utils/state_management/store';

// Mock the PplReference component
jest.mock('./ppl_reference', () => ({
  PplReference: () => <div data-test-subj="ppl-reference">PPL Reference</div>,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const defaultState = {
    query: {
      query: 'source=hello',
      language: 'PPL',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    },
    queryEditor: {
      editorMode: EditorMode.SingleQuery,
      promptModeIsAvailable: false,
      queryStatus: {
        status: 'UNINITIALIZED',
        elapsedMs: undefined,
        startTime: undefined,
        body: undefined,
      },
      lastExecutedPrompt: '',
    },
    ui: {
      showDatasetFields: false,
      prompt: '',
    },
    results: {},
    tab: {},
    legacy: {
      interval: 'auto',
      columns: [],
      sort: [],
    },
    ...initialState,
  };
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: defaultState as any,
  });
  return render(
    <Provider store={store}>
      <IntlProvider locale="en" messages={{}}>
        {component}
      </IntlProvider>
    </Provider>
  );
};

describe('DetectedLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Component Rendering', () => {
    it('should render with PPL language and query editor mode', () => {
      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      expect(screen.getByTestId('exploreDetectedLanguage')).toBeInTheDocument();
      expect(screen.getByText('PPL')).toBeInTheDocument();
    });

    it('should render with natural language/PPL text when dual mode is available', () => {
      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.DualQuery,
          promptModeIsAvailable: true,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      expect(screen.getByText('Natural Language/PPL')).toBeInTheDocument();
    });

    it('should render only natural language text in single prompt mode', () => {
      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SinglePrompt,
          promptModeIsAvailable: true,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      expect(screen.getByText('Natural Language')).toBeInTheDocument();
    });

    it('should render with info icon', () => {
      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      const icon = screen
        .getByTestId('exploreDetectedLanguage')
        .querySelector('[data-euiicon-type="iInCircle"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Button State', () => {
    it('should enable button when not in single prompt mode', () => {
      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      const button = screen.getByTestId('exploreDetectedLanguage');
      expect(button).not.toBeDisabled();
    });

    it('should disable button in single prompt mode', () => {
      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SinglePrompt,
          promptModeIsAvailable: true,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      const button = screen.getByTestId('exploreDetectedLanguage');
      expect(button).toBeDisabled();
    });
  });

  describe('Popover Behavior', () => {
    it('should open popover initially when localStorage key is not set', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      expect(screen.getByText('Syntax options')).toBeInTheDocument();
      expect(screen.getByTestId('ppl-reference')).toBeInTheDocument();
    });

    it('should not open popover initially when localStorage key is set to true', () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      expect(screen.queryByText('Syntax options')).not.toBeInTheDocument();
    });

    it('should open popover when button is clicked', () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      const button = screen.getByTestId('exploreDetectedLanguage');

      // Initially closed
      expect(screen.queryByText('Syntax options')).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(button);
      expect(screen.getByText('Syntax options')).toBeInTheDocument();
      expect(screen.getByTestId('ppl-reference')).toBeInTheDocument();
    });

    it('should set localStorage when popover is opened', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const initialState = {
        query: {
          language: 'PPL',
        },
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      };

      renderWithProviders(<DetectedLanguage />, initialState);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hasSeenInfoBox_PPL', 'true');
    });
  });

  describe('Text Content Based on Editor Mode', () => {
    const testCases = [
      {
        editorMode: EditorMode.SingleEmpty,
        promptModeIsAvailable: true,
        expected: 'Natural Language/PPL',
      },
      {
        editorMode: EditorMode.DualQuery,
        promptModeIsAvailable: true,
        expected: 'Natural Language/PPL',
      },
      {
        editorMode: EditorMode.DualPrompt,
        promptModeIsAvailable: true,
        expected: 'Natural Language/PPL',
      },
      {
        editorMode: EditorMode.SinglePrompt,
        promptModeIsAvailable: true,
        expected: 'Natural Language',
      },
      {
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: true,
        expected: 'PPL',
      },
      {
        editorMode: EditorMode.SingleQuery,
        promptModeIsAvailable: false,
        expected: 'PPL',
      },
    ];

    testCases.forEach(({ editorMode, promptModeIsAvailable, expected }) => {
      it(`should display "${expected}" for ${editorMode} mode with promptModeIsAvailable=${promptModeIsAvailable}`, () => {
        const initialState = {
          query: {
            language: 'PPL',
          },
          queryEditor: {
            editorMode,
            promptModeIsAvailable,
          },
        };

        renderWithProviders(<DetectedLanguage />, initialState);

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  });
});

describe('getLanguageReference', () => {
  it('should return PplReference component for PPL language', () => {
    const result = getLanguageReference('PPL');
    expect(result.type.name).toBe('PplReference');
  });

  it('should throw error for unsupported language', () => {
    expect(() => {
      getLanguageReference('UNSUPPORTED_LANGUAGE');
    }).toThrow('LanguageReference encountered an unhandled language: UNSUPPORTED_LANGUAGE');
  });
});
