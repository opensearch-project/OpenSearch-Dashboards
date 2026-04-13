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

jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../hooks/use_editor_operations', () => ({ useEditorOperations: jest.fn() }));
jest.mock('../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));

const mockUpdateQueryEditorState = jest.fn();
const mockSwitchEditorMode = jest.fn();
const mockClearEditor = jest.fn();
const mockFocusEditor = jest.fn();

const buildQueryBuilderState = (options: Record<string, any> = {}) => ({
  queryEditorState: {
    languageType: 'PPL',
    editorMode: EditorMode.Query,
    promptModeIsAvailable: false,
    ...options,
  },
  queryBuilder: { updateQueryEditorState: mockUpdateQueryEditorState },
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
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
});
