/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
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
jest.mock('../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI', sql: 'SQL' },
}));

// Languages the current dataset's type supports; the toggle only offers these.
const mockSupportedLanguages = jest.fn();
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(),
}));

// The data plugin's registered languages: their titles are the built-in languages' labels and the
// language test subjects.
const mockLanguageTitles: Record<string, string> = { PPL: 'PPL', PROMQL: 'PromQL', SQL: 'SQL' };
const mockLanguageService = {
  getLanguage: (id: string) =>
    mockLanguageTitles[id] ? { title: mockLanguageTitles[id] } : undefined,
  isLanguageSupportedForDataset: jest.fn((_config?: { title: string }) => true),
};
// The source type registry reads registered titles through the global services.
jest.mock('../../../services/services', () => ({
  ...jest.requireActual('../../../services/services'),
  getServices: () => ({
    data: { query: { queryString: { getLanguageService: () => mockLanguageService } } },
  }),
}));

const mockMarkStale = jest.fn();
const mockUpdateQueryEditorState = jest.fn();
const mockUpdateQueryState = jest.fn();
const mockSwitchEditorMode = jest.fn();
const mockClearEditor = jest.fn();
const mockFocusEditor = jest.fn();

const buildQueryBuilderState = (
  options: Record<string, any> = {},
  dataset: Record<string, string> = { id: 'ds', type: 'INDEX_PATTERN' }
) => ({
  queryEditorState: {
    languageType: 'PPL',
    editorMode: EditorMode.Query,
    promptModeIsAvailable: false,
    ...options,
  },
  // languageType mirrors the query's language; the toggle reads the language.
  queryState: {
    query: '',
    language: options.languageType ?? 'PPL',
    dataset,
  },
  queryBuilder: {
    updateQueryEditorState: mockUpdateQueryEditorState,
    updateQueryState: mockUpdateQueryState,
    // The click handler reads the row's dataset at execution time.
    queryState$: new BehaviorSubject({
      query: '',
      language: options.languageType ?? 'PPL',
      dataset,
    }),
  },
  container: { markStale: mockMarkStale },
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  setSourceTypeRegistry(new SourceTypeRegistryService());
  (useOpenSearchDashboards as jest.Mock).mockReturnValue({
    services: {
      sqlSupportEnabled: false,
      docLinks: {
        links: {
          noDocumentation: {
            sqlPplIndex: {
              base: 'https://docs/base',
              ppl: 'https://docs/ppl',
              sql: 'https://docs/sql',
            },
          },
        },
      },
      data: {
        query: {
          queryString: {
            getLanguageService: () => mockLanguageService,
            // The language's own initial query: SQL's base query, a registered language's sample.
            getInitialQueryByDataset: ({
              language,
              title,
            }: {
              language: string;
              title?: string;
            }) => ({
              query:
                language === 'SQL'
                  ? `SELECT * FROM ${title}`
                  : language === 'my_other_language'
                    ? 'my other query'
                    : '',
            }),
            getDatasetService: () => ({
              getType: (type: string) =>
                type === 'MY_SOURCE_TYPE'
                  ? { supportedLanguages: mockSupportedLanguages }
                  : { supportedLanguages: mockSupportedLanguages },
            }),
          },
        },
      },
    },
  });
  mockSupportedLanguages.mockReturnValue(['PPL', 'PROMQL']);
  mockLanguageService.isLanguageSupportedForDataset.mockReturnValue(true);
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
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('disables PromQL option when already on PROMQL', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ languageType: 'PROMQL' })
    );
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL')).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('disables AI option when already in prompt mode', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ editorMode: EditorMode.Prompt, promptModeIsAvailable: true })
    );
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  // it('switches to PromQL and updates languageType when PromQL is clicked', () => {
  it('switches the query language, keeping the dataset, when PromQL is clicked', () => {
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL'));
    expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Query);
    // expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({ languageType: 'PROMQL' });
    expect(mockUpdateQueryState).toHaveBeenCalledWith({
      language: 'PROMQL',
      query: '',
      queryOptions: undefined,
    });
    expect(mockUpdateQueryEditorState).not.toHaveBeenCalled();
    expect(mockClearEditor).toHaveBeenCalled();
  });

  it("offers only the current dataset's languages", () => {
    mockSupportedLanguages.mockReturnValue(['kuery', 'lucene', 'PPL']);
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PromQL')).not.toBeInTheDocument();
  });

  it('offers only the current language when there is no dataset', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue({
      ...buildQueryBuilderState(),
      queryState: { query: '', language: 'PPL', dataset: undefined },
    });
    render(<LanguageToggle />);
    openPopover();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PromQL')).not.toBeInTheDocument();
    expect(mockSupportedLanguages).not.toHaveBeenCalled();
  });

  it('shows the new language after it changes elsewhere, e.g. on dataset selection', () => {
    const { rerender } = render(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('PPL');

    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ languageType: 'PROMQL' })
    );
    rerender(<LanguageToggle />);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toHaveTextContent('PromQL');
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
    expect(mockUpdateQueryState).not.toHaveBeenCalled();
  });

  it('focuses editor after language switch', async () => {
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL'));
    await waitFor(() => jest.advanceTimersByTime(100));
    expect(mockFocusEditor).toHaveBeenCalledWith(true);
  });

  describe('on a registered source type dataset', () => {
    const SOURCE_DATASET = { id: 'my-dataset', title: 'my-dataset', type: 'MY_SOURCE_TYPE' };
    const registerSource = () => {
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
    };

    const renderForSource = (options: Record<string, any> = {}) => {
      registerSource();
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
      mockSupportedLanguages.mockReturnValue(['my_language', 'my_other_language']);
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
      // expect(screen.queryByTestId('queryPanelFooterLanguageToggle-AI')).not.toBeInTheDocument();
      // AI follows promptModeIsAvailable alone, on a registered source too.
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toBeInTheDocument();
    });

    it('marks the current language as selected', () => {
      mockSupportedLanguages.mockReturnValue(['my_language', 'my_other_language']);
      renderForSource();
      openPopover();

      expect(screen.getByTestId('queryPanelFooterLanguageToggle-my_language')).toHaveAttribute(
        'aria-current',
        'true'
      );
      expect(
        screen.getByTestId('queryPanelFooterLanguageToggle-my_other_language')
      ).not.toHaveAttribute('aria-current', 'true');
    });

    it('switches to the chosen language id', () => {
      mockSupportedLanguages.mockReturnValue(['my_language', 'my_other_language']);
      renderForSource();
      openPopover();
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-my_other_language'));

      expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Query);
      expect(mockClearEditor).toHaveBeenCalled();
      // expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({
      //   languageType: 'my_other_language',
      // });
      // The language lives on the query state (languageType was removed from the editor state).
      expect(mockUpdateQueryState).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'my_other_language', queryOptions: undefined })
      );
      // Switching the language is an edit: the button offers Update.
      expect(mockMarkStale).toHaveBeenCalled();
    });

    it('starts the chosen language with its own initial query', () => {
      mockSupportedLanguages.mockReturnValue(['my_language', 'my_other_language']);
      renderForSource();
      openPopover();
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-my_other_language'));

      expect(mockUpdateQueryState).toHaveBeenCalledWith({
        language: 'my_other_language',
        query: 'my other query',
        queryOptions: undefined,
      });
    });

    it("lists each of the source's languages once", () => {
      mockSupportedLanguages.mockReturnValue(['my_language', 'my_other_language']);
      renderForSource();
      openPopover();

      expect(screen.getAllByTestId('queryPanelFooterLanguageToggle-my_language')).toHaveLength(1);
      expect(
        screen.getAllByTestId('queryPanelFooterLanguageToggle-my_other_language')
      ).toHaveLength(1);
    });

    it('drops languages the source does not list, even if the dataset type does', () => {
      mockSupportedLanguages.mockReturnValue(['my_language', 'kuery']);
      renderForSource();
      openPopover();

      expect(screen.getByTestId('queryPanelFooterLanguageToggle-my_language')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-kuery')).not.toBeInTheDocument();
    });

    it("introduces the languages as the source's", () => {
      mockSupportedLanguages.mockReturnValue(['my_language']);
      renderForSource();
      openPopover();

      expect(screen.getByText('Query language for My source')).toBeInTheDocument();
      expect(screen.getByTestId('queryPanelFooterSourceType-My source')).toHaveTextContent(
        'My source'
      );
    });
  });

  describe('SQL', () => {
    const withSql = (sqlSupportEnabled: boolean) => {
      const { services } = (useOpenSearchDashboards as jest.Mock)();
      (useOpenSearchDashboards as jest.Mock).mockReturnValue({
        services: { ...services, sqlSupportEnabled },
      });
      mockSupportedLanguages.mockReturnValue(['PPL', 'SQL']);
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState({}, { id: 'logs', title: 'logs', type: 'INDEXES' })
      );
      render(<LanguageToggle />);
      openPopover();
    };

    it('is offered when SQL support is enabled', () => {
      withSql(true);
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
    });

    it('is hidden when SQL support is disabled', () => {
      withSql(false);
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
    });

    it('is hidden when SQL support is disabled, also on a registered source', () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'my-source',
        label: 'My source',
        datasetTypes: ['MY_SOURCE_TYPE'],
        resolveDefaultDataset: async () => undefined,
        languageSettings: { my_language: { label: 'My Language' }, SQL: { label: 'My SQL' } },
      });
      setSourceTypeRegistry(registry);
      mockSupportedLanguages.mockReturnValue(['my_language', 'SQL']);
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState(
          { languageType: 'my_language' },
          { id: 'my-dataset', title: 'my-dataset', type: 'MY_SOURCE_TYPE' }
        )
      );
      render(<LanguageToggle />);
      openPopover();

      expect(screen.getByTestId('queryPanelFooterLanguageToggle-my_language')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
    });
  });

  describe('source type', () => {
    it("shows the dataset's source as the selected, non-interactive entry", () => {
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState({}, { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' })
      );
      render(<LanguageToggle />);
      openPopover();

      const source = screen.getByTestId('queryPanelFooterSourceType-OpenSearch');
      expect(source.tagName).toBe('DIV');
      expect(source).toHaveAttribute('aria-current', 'true');
      expect(screen.getByText('Query language')).toBeInTheDocument();
    });

    it('calls the built-in source Prometheus for a Prometheus dataset', () => {
      mockSupportedLanguages.mockReturnValue(['PROMQL']);
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState(
          { languageType: 'PROMQL' },
          { id: 'prom', title: 'prom', type: 'PROMETHEUS' }
        )
      );
      render(<LanguageToggle />);
      openPopover();

      expect(screen.getByTestId('queryPanelFooterSourceType-OpenSearch')).toHaveTextContent(
        'Prometheus'
      );
    });

    it('shows no source without a dataset', () => {
      const state = buildQueryBuilderState();
      // (buildQueryBuilderState defaults the dataset; clear it.)
      (state.queryState as Record<string, unknown>).dataset = undefined;
      (useQueryBuilderState as jest.Mock).mockReturnValue(state);
      render(<LanguageToggle />);
      openPopover();

      expect(screen.queryByText('Source type')).not.toBeInTheDocument();
    });
  });

  it("hides a language the dataset's engine version can't run", () => {
    mockLanguageService.isLanguageSupportedForDataset.mockImplementation(
      (config?: { title: string }) => config?.title !== 'PromQL'
    );
    render(<LanguageToggle />);
    openPopover();

    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PromQL')).not.toBeInTheDocument();
  });

  it('goes back to query mode, keeping the query, when the current language is picked in prompt mode', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({ editorMode: EditorMode.Prompt, promptModeIsAvailable: true })
    );
    render(<LanguageToggle />);
    openPopover();
    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PPL'));

    expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Query);
    expect(mockClearEditor).not.toHaveBeenCalled();
    expect(mockUpdateQueryState).not.toHaveBeenCalled();
  });

  describe('learn more link', () => {
    it("links the row's own language", () => {
      render(<LanguageToggle />);
      openPopover();

      const link = screen.getByTestId('exploreQueryPanelLearnMore');
      expect(link).toHaveTextContent('Learn more about PPL');
      expect(link).toHaveAttribute('href', 'https://docs/ppl');
    });

    it('follows the language after it changes', () => {
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState({ languageType: 'PROMQL' })
      );
      render(<LanguageToggle />);
      openPopover();

      expect(screen.getByTestId('exploreQueryPanelLearnMore')).toHaveTextContent(
        'Learn more about PromQL'
      );
    });

    it('is hidden in prompt mode', () => {
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState({ editorMode: EditorMode.Prompt, promptModeIsAvailable: true })
      );
      render(<LanguageToggle />);
      openPopover();

      expect(screen.queryByTestId('exploreQueryPanelLearnMore')).not.toBeInTheDocument();
    });

    it("links a source's own doc for its language", () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'my-source',
        label: 'My source',
        datasetTypes: ['MY_SOURCE_TYPE'],
        resolveDefaultDataset: async () => undefined,
        languageSettings: {
          my_language: {
            label: 'My Language',
            docLink: { title: 'My Language docs', url: 'https://my/docs' },
          },
        },
      });
      setSourceTypeRegistry(registry);
      mockSupportedLanguages.mockReturnValue(['my_language']);
      (useQueryBuilderState as jest.Mock).mockReturnValue(
        buildQueryBuilderState(
          { languageType: 'my_language' },
          { id: 'my-dataset', title: 'my-dataset', type: 'MY_SOURCE_TYPE' }
        )
      );
      render(<LanguageToggle />);
      openPopover();

      const link = screen.getByTestId('exploreQueryPanelLearnMore');
      expect(link).toHaveTextContent('My Language docs');
      expect(link).toHaveAttribute('href', 'https://my/docs');
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
  });
});
