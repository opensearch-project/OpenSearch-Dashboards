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
      Mocked QueryEditorExtension {config.id} with{' '}
      {dependencies.indexPatterns?.map((i) => (typeof i === 'string' ? i : i.title)).join(', ')}
    </div>
  )),
}));

describe('QueryEditorExtensions', () => {
  const defaultProps: QueryEditorExtensionsProps = {
    indexPatterns: [
      {
        id: '1234',
        title: 'logstash-*',
        fields: [
          {
            name: 'response',
            type: 'number',
            esTypes: ['integer'],
            aggregatable: true,
            filterable: true,
            searchable: true,
          },
        ],
      },
    ],
    componentContainer: document.createElement('div'),
    bannerContainer: document.createElement('div'),
    language: 'Test',
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
      '1': { id: '1', order: 2, isEnabled: jest.fn(), getComponent: jest.fn() },
      '2': { id: '2', order: 1, isEnabled: jest.fn(), getComponent: jest.fn() },
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
      '1': { id: '1', order: 1, isEnabled: jest.fn(), getComponent: jest.fn() },
    };

    const { getByText } = render(<QueryEditorExtensions {...defaultProps} configMap={configMap} />);

    await waitFor(() => {
      expect(getByText(/logstash-\*/)).toBeInTheDocument();
    });

    expect(QueryEditorExtension).toHaveBeenCalledWith(
      expect.objectContaining({
        dependencies: { indexPatterns: defaultProps.indexPatterns, language: 'Test' },
      }),
      expect.anything()
    );
  });
});
