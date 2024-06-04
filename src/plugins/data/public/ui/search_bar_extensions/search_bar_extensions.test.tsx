/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { SearchBarExtension } from './search_bar_extension';
import { SearchBarExtensions } from './search_bar_extensions';

type SearchBarExtensionProps = ComponentProps<typeof SearchBarExtension>;
type SearchBarExtensionsProps = ComponentProps<typeof SearchBarExtensions>;

jest.mock('./search_bar_extension', () => ({
  SearchBarExtension: jest.fn(({ config, dependencies }: SearchBarExtensionProps) => (
    <div>
      Mocked SearchBarExtension {config.id} with{' '}
      {dependencies.indexPatterns?.map((i) => i.title).join(', ')}
    </div>
  )),
}));

describe('SearchBarExtensions', () => {
  const defaultProps: SearchBarExtensionsProps = {
    dependencies: {
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
    },
    portalInsert: { sibling: document.createElement('div'), position: 'after' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without any configurations', () => {
    const { container } = render(<SearchBarExtensions {...defaultProps} configs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('throws error on duplicate configuration ids', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const configs = [
      { id: '1', order: 1, isEnabled: jest.fn(), getComponent: jest.fn() },
      { id: '1', order: 2, isEnabled: jest.fn(), getComponent: jest.fn() },
    ];

    expect(() => {
      render(<SearchBarExtensions {...defaultProps} configs={configs} />);
    }).toThrow("Duplicate search bar extension id '1' found.");
  });

  it('correctly orders configurations based on order property', () => {
    const configs = [
      { id: '1', order: 2, isEnabled: jest.fn(), getComponent: jest.fn() },
      { id: '2', order: 1, isEnabled: jest.fn(), getComponent: jest.fn() },
    ];

    const { getAllByText } = render(<SearchBarExtensions {...defaultProps} configs={configs} />);
    const renderedExtensions = getAllByText(/Mocked SearchBarExtension/);

    expect(renderedExtensions).toHaveLength(2);
    expect(renderedExtensions[0]).toHaveTextContent('2');
    expect(renderedExtensions[1]).toHaveTextContent('1');
  });

  it('passes dependencies correctly to SearchBarExtension', async () => {
    const configs = [{ id: '1', order: 1, isEnabled: jest.fn(), getComponent: jest.fn() }];

    const { getByText } = render(<SearchBarExtensions {...defaultProps} configs={configs} />);

    await waitFor(() => {
      expect(getByText(/logstash-\*/)).toBeInTheDocument();
    });

    expect(SearchBarExtension).toHaveBeenCalledWith(
      expect.objectContaining({
        dependencies: defaultProps.dependencies,
      }),
      expect.anything()
    );
  });
});
