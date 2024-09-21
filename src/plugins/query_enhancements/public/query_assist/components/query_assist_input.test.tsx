/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { SuggestionsComponentProps } from '../../../../data/public/ui/typeahead/suggestions_component';
import { AgentError } from '../utils';
import { QueryAssistInput } from './query_assist_input';

jest.mock('../../services', () => ({
  getData: () => ({
    ui: {
      SuggestionsComponent: ({ show, suggestions, onClick }: SuggestionsComponentProps) => (
        <div data-test-subj="suggestions-component">
          {show &&
            suggestions.map((s, i) => (
              <button key={i} onClick={() => onClick(s)}>
                {s.text}
              </button>
            ))}
        </div>
      ),
    },
  }),
}));

const mockPersistedLog = {
  get: () => ['mock suggestion 1', 'mock suggestion 2'],
} as any;

type QueryAssistInputProps = ComponentProps<typeof QueryAssistInput>;

const renderQueryAssistInput = (overrideProps: Partial<QueryAssistInputProps> = {}) => {
  const props: QueryAssistInputProps = Object.assign<
    QueryAssistInputProps,
    Partial<QueryAssistInputProps>
  >(
    { inputRef: { current: null }, persistedLog: mockPersistedLog, isDisabled: false },
    overrideProps
  );
  const component = render(
    <I18nProvider>
      <QueryAssistInput {...props} />
    </I18nProvider>
  );
  return { component, props: props as jest.MockedObjectDeep<QueryAssistInputProps> };
};

describe('<QueryAssistInput /> spec', () => {
  it('should display input', () => {
    const { component } = renderQueryAssistInput();
    const inputElement = component.getByTestId('query-assist-input-field-text') as HTMLInputElement;
    expect(inputElement).toBeInTheDocument();
    fireEvent.change(inputElement, { target: { value: 'new value' } });
    expect(inputElement.value).toBe('new value');
  });

  it('should display suggestions on input click', () => {
    const { component } = renderQueryAssistInput();
    const inputElement = component.getByTestId('query-assist-input-field-text') as HTMLInputElement;
    fireEvent.click(inputElement);
    const suggestionsComponent = component.getByTestId('suggestions-component');
    expect(suggestionsComponent).toBeInTheDocument();
  });

  it('should update input value on suggestion click', () => {
    const { component } = renderQueryAssistInput();
    const inputElement = component.getByTestId('query-assist-input-field-text') as HTMLInputElement;
    fireEvent.click(inputElement);
    const suggestionButton = component.getByText('mock suggestion 1');
    fireEvent.click(suggestionButton);
    expect(inputElement.value).toBe('mock suggestion 1');
  });

  it('should show error badge if there is an error', async () => {
    renderQueryAssistInput({
      error: new AgentError({
        error: { type: 'mock-type', reason: 'mock-reason', details: 'mock-details' },
        status: 303,
      }),
    });
    expect(screen.getByTestId('queryAssistErrorBadge')).toBeInTheDocument();
  });
});
