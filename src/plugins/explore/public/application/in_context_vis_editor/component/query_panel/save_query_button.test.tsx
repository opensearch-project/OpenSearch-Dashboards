/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SaveQueryButton } from './save_query_button';
import { EditorMode } from '../../../utils/state_management/types';
import { QueryPanelFullProps } from './query_panel_context';

const mockGetEditorText = jest.fn().mockReturnValue('source=logs | head 10');
const mockSetEditorText = jest.fn();
const mockHandleQueryChange = jest.fn();
const mockHandleEditorChange = jest.fn();
const mockSaveQuery = jest.fn();
const mockGetSavedQuery = jest.fn();
const mockAddSuccess = jest.fn();
const mockAddDanger = jest.fn();
const mockGetTime = jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' });
const mockGetRefreshInterval = jest.fn().mockReturnValue({ pause: true, value: 0 });
const mockSetRefreshInterval = jest.fn();

let mockQueryEditorState: any;
let mockQueryState: any;

jest.mock('../../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));

jest.mock('./query_panel_context', () => ({
  useQueryPanelContext: (): Partial<QueryPanelFullProps> => ({
    services: {
      data: {
        query: {
          savedQueries: {
            saveQuery: mockSaveQuery,
            getSavedQuery: mockGetSavedQuery,
          },
          timefilter: {
            timefilter: {
              getTime: mockGetTime,
              getRefreshInterval: mockGetRefreshInterval,
              setRefreshInterval: mockSetRefreshInterval,
            },
          },
        },
      },
      notifications: {
        toasts: {
          addSuccess: mockAddSuccess,
          addDanger: mockAddDanger,
        },
      },
      appName: 'explore',
    } as any,
    queryEditorState: mockQueryEditorState,
    queryState: mockQueryState,
    handleQueryChange: mockHandleQueryChange,
    handleEditorChange: mockHandleEditorChange,
    editorOperations: {
      getEditorText: mockGetEditorText,
      setEditorText: mockSetEditorText,
    } as any,
  }),
}));

let capturedOnLoad: any;
let capturedSaveQuery: any;
let capturedOnClearSavedQuery: any;
let capturedSaveQueryIsDisabled: boolean;

jest.mock('../../../../../../data/public', () => ({
  SavedQueryManagementComponent: (props: any) => {
    capturedOnLoad = props.onLoad;
    capturedSaveQuery = props.saveQuery;
    capturedOnClearSavedQuery = props.onClearSavedQuery;
    capturedSaveQueryIsDisabled = props.saveQueryIsDisabled;
    return <div data-test-subj="mock-saved-query-panel" />;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryEditorState = {
    editorMode: EditorMode.Query,
    languageType: 'PPL',
  };
  mockQueryState = { query: 'source=logs', language: 'PPL' };
  mockSaveQuery.mockResolvedValue({ id: 'saved-1' });
  mockGetSavedQuery.mockResolvedValue(undefined);
});

describe('SaveQueryButton', () => {
  it('renders the save query button', () => {
    render(<SaveQueryButton />);
    expect(screen.getByTestId('queryPanelFooterSaveQueryButton')).toBeInTheDocument();
  });

  it('opens save query panel on button click', () => {
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
    expect(screen.getByTestId('mock-saved-query-panel')).toBeInTheDocument();
  });

  it('disables save when in prompt mode', () => {
    mockQueryEditorState = { editorMode: EditorMode.Prompt, languageType: 'PPL' };
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
    expect(capturedSaveQueryIsDisabled).toBe(true);
  });

  it('enables save when in query mode', () => {
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
    expect(capturedSaveQueryIsDisabled).toBe(false);
  });

  it('saves query with editor text and shows success toast', async () => {
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));

    await capturedSaveQuery({ title: 'My Query', description: 'test' });

    expect(mockSaveQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My Query',
        description: 'test',
        query: expect.objectContaining({ query: 'source=logs | head 10' }),
      }),
      expect.any(Object)
    );
    expect(mockAddSuccess).toHaveBeenCalledWith(expect.stringContaining('My Query'));
  });

  it('loads a saved query and updates editor', async () => {
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));

    const savedQuery = {
      id: 'sq-1',
      attributes: {
        query: { query: 'source=metrics', language: 'PPL' },
      },
    };

    await capturedOnLoad(savedQuery);

    expect(mockHandleQueryChange).toHaveBeenCalledWith(savedQuery.attributes.query);
    expect(mockSetEditorText).toHaveBeenCalledWith('source=metrics');
  });

  it('loads a saved query with time filter and updates date range', async () => {
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));

    const savedQuery = {
      id: 'sq-2',
      attributes: {
        query: { query: 'source=logs', language: 'PPL' },
        timefilter: {
          from: 'now-1h',
          to: 'now',
          refreshInterval: { pause: false, value: 5000 },
        },
      },
    };

    await capturedOnLoad(savedQuery);

    expect(mockHandleEditorChange).toHaveBeenCalledWith({
      dateRange: { from: 'now-1h', to: 'now' },
    });
    expect(mockSetRefreshInterval).toHaveBeenCalledWith({ pause: false, value: 5000 });
  });

  it('clears saved query ID on clear', () => {
    render(<SaveQueryButton />);
    fireEvent.click(screen.getByTestId('queryPanelFooterSaveQueryButton'));
    capturedOnClearSavedQuery();
    // No error thrown, popover closes
  });
});
