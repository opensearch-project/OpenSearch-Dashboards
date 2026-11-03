/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageToggle } from './lauguage_toggle';
import { EditorMode } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';

jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../hooks/use_editor_operations', () => ({ useEditorOperations: jest.fn() }));
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(),
}));
jest.mock('../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));

const mockUpdateQueryEditorState = jest.fn();
const mockSwitchEditorMode = jest.fn();
const mockClearEditor = jest.fn();
const mockFocusEditor = jest.fn();

const buildQueryBuilderState = (options: Record<string, any> = {}, dataset?: object) => ({
  queryState: { query: '', language: options.languageType ?? 'PPL', dataset },
  queryEditorState: {
    languageType: 'PPL',
    editorMode: EditorMode.Query,
    promptModeIsAvailable: false,
    ...options,
  },
  queryBuilder: { updateQueryEditorState: mockUpdateQueryEditorState },
});

// A source type registered by another plugin, with its own dataset type and languages.
const SOURCE_DATASET = { id: 'my-dataset', title: 'my-dataset', type: 'MY_SOURCE_TYPE' };
const mockSupportedLanguages = jest.fn(() => ['my_language', 'my_other_language']);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  const registry = new SourceTypeRegistryService();
  registry.register({
    id: 'my-source',
    label: 'My source',
    datasetTypes: ['MY_SOURCE_TYPE'],
    resolveDefaultDataset: async () => undefined,
    languageSettings: {
      my_language: { label: 'My Language' },
      my_other_language: { label: 'My Other Language' },
    },
  });
  setSourceTypeRegistry(registry);
  (useOpenSearchDashboards as jest.Mock).mockReturnValue({
    services: {
      sqlSupportEnabled: false,
      data: {
        query: {
          queryString: {
            getDatasetService: () => ({
              getType: (type: string) =>
                type === 'MY_SOURCE_TYPE'
                  ? { supportedLanguages: mockSupportedLanguages }
                  : undefined,
            }),
          },
        },
      },
    },
  });
  (useQueryBuilderState as jest.Mock).mockReturnValue(buildQueryBuilderState());
  (useEditorOperations as jest.Mock).mockReturnValue({
    switchEditorMode: mockSwitchEditorMode,
    clearEditor: mockClearEditor,
    focusEditor: mockFocusEditor,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

const openPopover = () => {
  fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));
};

describe('LanguageToggle', () => {
  it('renders the toggle button', () => {
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();
  });

  it('shows PPL label when language is PPL', () => {
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('PPL');
  });

  it('shows PromQL label when language is PROMQL', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ languageType: 'PROMQL' })
    );
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('PromQL');
  });

  it('shows AI label when in prompt mode', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ editorMode: EditorMode.Prompt })
    );
    render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('AI');
  });

  it('opens popover on button click', () => {
    render(<LanguageToggle />);
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PPL')).not.toBeInTheDocument();
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL')).toBeInTheDocument();
  });

  it('does not show AI option when promptModeIsAvailable is false', () => {
    render(<LanguageToggle />);
    openPopover();
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-AI')).not.toBeInTheDocument();
  });

  it('shows AI option when promptModeIsAvailable is true', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ promptModeIsAvailable: true })
    );
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toBeInTheDocument();
  });

  it('disables PPL option when already on PPL', () => {
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeDisabled();
  });

  it('disables PromQL option when already on PROMQL', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ languageType: 'PROMQL' })
    );
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL')).toBeDisabled();
  });

  it('disables AI option when already in prompt mode', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ editorMode: EditorMode.Prompt, promptModeIsAvailable: true })
    );
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toBeDisabled();
  });

  it('switches to PromQL and updates languageType when PromQL is clicked', () => {
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL'));
    expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Query);
    expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({ languageType: 'PROMQL' });
    expect(mockClearEditor).toHaveBeenCalled();
  });

  it('switches to prompt mode when AI is clicked', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ promptModeIsAvailable: true })
    );
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-AI'));
    expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Prompt);
    expect(mockUpdateQueryEditorState).not.toHaveBeenCalled();
  });

  it('focuses editor after language switch', async () => {
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL'));
    await waitFor(() => jest.advanceTimersByTime(100));
    expect(mockFocusEditor).toHaveBeenCalledWith(true);
  });

  describe('on a registered source type dataset', () => {
    const renderForSource = (options: Record<string, any> = {}) => {
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState({ languageType: 'my_language', ...options }, SOURCE_DATASET)
      );
      return render(<LanguageToggle />);
    };

    it("shows the source's label for the current language", () => {
      renderForSource();
      expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('My Language');
    });

    it("lists the dataset type's languages instead of the built-in ones", () => {
      renderForSource({ promptModeIsAvailable: true });
      openPopover();
      expect(mockSupportedLanguages).toHaveBeenCalledWith(SOURCE_DATASET);
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-my_language')).toHaveTextContent(
        'My Language'
      );
      expect(
        screen.getByTestId('queryPanelFooterLanguageToggle-my_other_language')
      ).toHaveTextContent('My Other Language');
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PPL')).not.toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PromQL')).not.toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-AI')).not.toBeInTheDocument();
    });

    it('disables the current language', () => {
      renderForSource();
      openPopover();
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-my_language')).toBeDisabled();
      expect(
        screen.getByTestId('queryPanelFooterLanguageToggle-my_other_language')
      ).not.toBeDisabled();
    });

    it('switches to the chosen language id', () => {
      renderForSource();
      openPopover();
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-my_other_language'));
      expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Query);
      expect(mockClearEditor).toHaveBeenCalled();
      expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({
        languageType: 'my_other_language',
      });
    });
  });

  it('keeps the built-in list on an OpenSearch dataset', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({}, { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' })
    );
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL')).toBeInTheDocument();
    expect(mockSupportedLanguages).not.toHaveBeenCalled();
  });
});
