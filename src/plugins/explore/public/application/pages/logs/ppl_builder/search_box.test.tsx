/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBox } from './search_box';

// Extend the global @osd/monaco mock, which omits setupPPLTokenization that SearchBox calls.
jest.mock('@osd/monaco', () => {
  const actual = jest.requireActual('@osd/monaco');
  return { ...actual, setupPPLTokenization: jest.fn() };
});

// Render Monaco-backed CodeEditor as a plain textbox (breaks in jsdom otherwise).
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({ value, onChange }: any) => (
    <input
      data-test-subj="pplBuilderSearchBoxInput"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const renderBox = (props: Partial<React.ComponentProps<typeof SearchBox>> = {}) => {
  const onChange = jest.fn();
  const onRequestValues = jest.fn(async () => []);
  const utils = render(
    <SearchBox
      value={props.value ?? ''}
      fieldNames={props.fieldNames ?? ['service', 'bytes']}
      onRequestValues={props.onRequestValues ?? onRequestValues}
      onChange={props.onChange ?? onChange}
    />
  );
  return { ...utils, onChange, onRequestValues };
};

describe('SearchBox', () => {
  it('renders the search box container and the (mocked) editor input', () => {
    renderBox();
    expect(screen.getByTestId('pplBuilderSearchBox')).toBeInTheDocument();
    expect(screen.getByTestId('pplBuilderSearchBoxInput')).toBeInTheDocument();
  });

  it('shows the placeholder overlay only when the value is empty', () => {
    const { rerender } = renderBox({ value: '' });
    expect(screen.getByText(/Search or filter your data/i)).toBeInTheDocument();

    rerender(
      <SearchBox
        value="service=web"
        fieldNames={['service']}
        onRequestValues={jest.fn(async () => [])}
        onChange={jest.fn()}
      />
    );
    expect(screen.queryByText(/Search or filter your data/i)).not.toBeInTheDocument();
  });

  it('seeds the editor from the value prop', () => {
    renderBox({ value: 'status>=500' });
    expect(screen.getByTestId('pplBuilderSearchBoxInput')).toHaveValue('status>=500');
  });

  it('forwards edited text through onChange', () => {
    const { onChange } = renderBox();
    fireEvent.change(screen.getByTestId('pplBuilderSearchBoxInput'), {
      target: { value: 'error AND status=500' },
    });
    expect(onChange).toHaveBeenCalledWith('error AND status=500');
  });
});
