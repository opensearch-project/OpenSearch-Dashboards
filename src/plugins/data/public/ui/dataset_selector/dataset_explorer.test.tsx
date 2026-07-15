/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { DatasetExplorer } from './dataset_explorer';
import { DataStructure } from '../../../common';

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
  (({
    getDatasetService: () => ({
      fetchOptions,
      getType: () => ({ id: 'INDEX', toDataset: jest.fn() }),
      getLastCacheTime: () => undefined,
    }),
  } as unknown) as any);

const services = ({
  uiSettings: { get: () => 'MMM D, YYYY @ HH:mm:ss.SSS' },
  http: { basePath: { get: () => '' } },
} as unknown) as any;

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
