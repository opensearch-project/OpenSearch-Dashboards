/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { QueryEditorExtension } from './query_editor_extension';
import QueryEditorExtensions from './query_editor_extensions';

type QueryEditorExtensionProps = ComponentProps<typeof QueryEditorExtension>;
type QueryEditorExtensionsProps = ComponentProps<typeof QueryEditorExtensions>;

jest.mock('./query_editor_extension', () => ({
  QueryEditorExtension: jest.fn(({ config, dependencies }: QueryEditorExtensionProps) => (
    <div>
      Mocked QueryEditorExtension {config.id} with {dependencies.language}
    </div>
  )),
}));

const mockQuery = {
  query: 'dummy query',
  language: 'kuery',
  dataset: {
    id: 'db',
    title: 'db',
    type: 'index',
    dataSource: { id: 'testId', type: 'DATA_SOURCE', title: 'testTitle' },
  },
};

describe('QueryEditorExtensions', () => {
  const defaultProps: QueryEditorExtensionsProps = {
    componentContainer: document.createElement('div'),
    bannerContainer: document.createElement('div'),
    queryControlsContainer: document.createElement('div'),
    language: 'Test-lang',
    onSelectLanguage: jest.fn(),
    isCollapsed: false,
    setIsCollapsed: jest.fn(),
    query: mockQuery,
    bottomPanelContainer: document.createElement('div'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without any configurations', () => {
    const { container } = render(<QueryEditorExtensions {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders without any items in map', () => {
    const { container } = render(<QueryEditorExtensions {...defaultProps} configMap={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('correctly orders configurations based on order property', () => {
    const configMap = {
      '1': { id: '1', order: 2, isEnabled$: jest.fn(), getComponent: jest.fn() },
      '2': { id: '2', order: 1, isEnabled$: jest.fn(), getComponent: jest.fn() },
    };

    const { getAllByText } = render(
      <QueryEditorExtensions {...defaultProps} configMap={configMap} />
    );
    const renderedExtensions = getAllByText(/Mocked QueryEditorExtension/);

    expect(renderedExtensions).toHaveLength(2);
    expect(renderedExtensions[0]).toHaveTextContent('2');
    expect(renderedExtensions[1]).toHaveTextContent('1');
  });

  it('passes dependencies correctly to QueryEditorExtension', async () => {
    const configMap = {
      '1': { id: '1', order: 1, isEnabled$: jest.fn(), getComponent: jest.fn() },
    };

    const { getByText } = render(<QueryEditorExtensions {...defaultProps} configMap={configMap} />);

    await waitFor(() => {
      expect(getByText(/Test-lang/)).toBeInTheDocument();
    });

    expect(QueryEditorExtension).toHaveBeenCalledWith(
      expect.objectContaining({
        dependencies: {
          language: 'Test-lang',
          onSelectLanguage: expect.any(Function),
          isCollapsed: false,
          setIsCollapsed: expect.any(Function),
          query: mockQuery,
        },
      }),
      expect.anything()
    );
  });
});
