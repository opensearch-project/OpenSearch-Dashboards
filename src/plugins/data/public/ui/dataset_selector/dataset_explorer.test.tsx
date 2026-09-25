/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { DatasetExplorer } from './dataset_explorer';
import { DataStructure } from '../../../common';
// EuiSelectable's real list is virtualized and renders no rows in jsdom, so stub it with a
// minimal search input + substring filter to exercise typing. Other EUI components stay real.
jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');
  const ReactActual = jest.requireActual('react');
  return {
    ...original,
    EuiSelectable: ({ options, searchable }: any) => {
      const [searchValue, setSearchValue] = ReactActual.useState('');
      const normalizedSearch = searchValue.trim().toLowerCase();
      const visibleOptions = options.filter((option: any) => {
        if (option.isGroupLabel) return false;
        if (!normalizedSearch) return true;
        const searchableText = (option.searchableLabel || option.label || '').toLowerCase();
        return searchableText.includes(normalizedSearch);
      });
      return (
        <div>
          {searchable && (
            <input
              data-test-subj="mockSelectableSearch"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
            />
          )}
          <ul data-test-subj="mockSelectableOptions">
            {visibleOptions.map((option: any) => (
              <li key={option.value ?? option.label} data-test-subj={`option-${option.value}`}>
                <span data-test-subj="option-label">{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    },
  };
});

// Capture the props the custom DataStructureCreator receives so we can assert seeding.
let lastCreatorProps: any;
const CustomCreator = (props: any) => {
  lastCreatorProps = props;
  return <div data-test-subj="custom-creator" />;
};

// fetchOptions is called with the growing path when a level is auto-selected; we assert on it to
// learn WHICH data source was auto-selected (its id is the last element of the path passed in).
const fetchOptions = jest.fn().mockResolvedValue({
  id: 'indexes',
  title: 'Indexes',
  type: 'INDEX',
  hasNext: false,
  columnHeader: 'Indexes',
  DataStructureCreator: CustomCreator,
  children: [],
});

const makeQueryString = () =>
  ({
    getDatasetService: () => ({
      fetchOptions,
      getType: () => ({ id: 'INDEX', toDataset: jest.fn() }),
      getLastCacheTime: () => undefined,
    }),
  }) as unknown as any;

const services = {
  uiSettings: { get: () => 'MMM D, YYYY @ HH:mm:ss.SSS' },
  http: { basePath: { get: () => '' } },
} as unknown as any;

const dataSourceNode = (id: string, title: string): DataStructure => ({
  id,
  title,
  type: 'DATA_SOURCE',
  hasNext: true,
});

const rootPath = (children: DataStructure[]): DataStructure[] => [
  {
    id: 'root',
    title: 'Select data',
    type: 'root',
    columnHeader: 'Select data',
    hasNext: true,
    children,
  },
];

const renderExplorer = (props: any = {}) => {
  const setPath = jest.fn();
  render(
    <I18nProvider>
      <DatasetExplorer
        services={services}
        queryString={makeQueryString()}
        path={rootPath([dataSourceNode('ds-1', 'Cluster 1'), dataSourceNode('ds-2', 'Cluster 2')])}
        setPath={setPath}
        onNext={jest.fn()}
        onCancel={jest.fn()}
        {...props}
      />
    </I18nProvider>
  );
  return { setPath };
};

// The data source selected at the data-source level = the last element of the path fetchOptions saw.
const autoSelectedDataSourceId = () => {
  const pathArg = fetchOptions.mock.calls[0][1] as DataStructure[];
  return pathArg[pathArg.length - 1].id;
};

describe('DatasetExplorer initial-selection props', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastCreatorProps = undefined;
  });

  it('auto-selects the FIRST data source by default (no initialDataSourceId)', async () => {
    renderExplorer();
    await waitFor(() => expect(fetchOptions).toHaveBeenCalled());
    expect(autoSelectedDataSourceId()).toBe('ds-1');
  });

  it('auto-selects the caller-preferred data source when initialDataSourceId matches (MDS)', async () => {
    renderExplorer({ initialDataSourceId: 'ds-2' });
    await waitFor(() => expect(fetchOptions).toHaveBeenCalled());
    expect(autoSelectedDataSourceId()).toBe('ds-2');
  });

  it('falls back to the first data source when initialDataSourceId does not match any child', async () => {
    renderExplorer({ initialDataSourceId: 'does-not-exist' });
    await waitFor(() => expect(fetchOptions).toHaveBeenCalled());
    expect(autoSelectedDataSourceId()).toBe('ds-1');
  });

  it('forwards initialSelectedItems to a custom DataStructureCreator', async () => {
    // A single data source that leads straight to the index creator column.
    render(
      <I18nProvider>
        <DatasetExplorer
          services={services}
          queryString={makeQueryString()}
          path={[
            {
              id: 'ds-1',
              title: 'Cluster 1',
              type: 'DATA_SOURCE',
              hasNext: false,
              columnHeader: 'Indexes',
              DataStructureCreator: CustomCreator,
              children: [],
            },
          ]}
          setPath={jest.fn()}
          onNext={jest.fn()}
          onCancel={jest.fn()}
          initialSelectedItems={['logs-app-*']}
        />
      </I18nProvider>
    );
    await waitFor(() => expect(lastCreatorProps).toBeDefined());
    expect(lastCreatorProps.initialSelectedItems).toEqual(['logs-app-*']);
  });

  it('passes undefined initialSelectedItems to the creator by default (backward-compatible)', async () => {
    render(
      <I18nProvider>
        <DatasetExplorer
          services={services}
          queryString={makeQueryString()}
          path={[
            {
              id: 'ds-1',
              title: 'Cluster 1',
              type: 'DATA_SOURCE',
              hasNext: false,
              columnHeader: 'Indexes',
              DataStructureCreator: CustomCreator,
              children: [],
            },
          ]}
          setPath={jest.fn()}
          onNext={jest.fn()}
          onCancel={jest.fn()}
        />
      </I18nProvider>
    );
    await waitFor(() => expect(lastCreatorProps).toBeDefined());
    expect(lastCreatorProps.initialSelectedItems).toBeUndefined();
  });
});

describe('DatasetExplorer search behavior', () => {
  it('keeps a pattern searchable by its title even when a displayName is shown', () => {
    const path: DataStructure[] = [
      {
        id: 'root',
        title: 'Select data',
        type: 'root',
        columnHeader: 'Select data',
        hasNext: false,
        children: [
          {
            id: 'pattern-1',
            title: 'logs-prod-*',
            type: 'INDEX_PATTERN',
            meta: { displayName: 'Production Logs' },
            parent: { id: 'ds-1', title: 'Cluster 1', type: 'DATA_SOURCE' },
          },
          {
            id: 'pattern-2',
            title: 'metrics-*',
            type: 'INDEX_PATTERN',
          },
        ],
      },
    ];

    render(
      <I18nProvider>
        <DatasetExplorer
          services={services}
          queryString={makeQueryString()}
          path={path}
          setPath={jest.fn()}
          onNext={jest.fn()}
          onCancel={jest.fn()}
        />
      </I18nProvider>
    );

    // The displayed label shows the friendly name...
    expect(
      within(screen.getByTestId('option-pattern-1')).getByTestId('option-label')
    ).toHaveTextContent('Cluster 1::Production Logs');

    // ...but typing the pattern's raw title into the filter still finds it, and doesn't match
    // the unrelated pattern
    fireEvent.change(screen.getByTestId('mockSelectableSearch'), {
      target: { value: 'logs-prod' },
    });

    expect(screen.getByTestId('option-pattern-1')).toBeInTheDocument();
    expect(screen.queryByTestId('option-pattern-2')).not.toBeInTheDocument();
  });
});
