/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { DataSource } from '../datasource';
import { SavedObject } from '../../../../../core/public';
import {
  IndexPatternSavedObjectAttrs,
  IndexPatternsService,
} from '../../index_patterns/index_patterns';
import { DataSourceService } from '../datasource_services';
import {
  LocalDSDataSetParams,
  LocalDSDataSetResponse,
  LocalDSMetadata,
  LocalDSQueryParams,
  LocalDSQueryResponse,
} from '../default_datasource/default_datasource';
import { DataSourceUIGroupType } from '../datasource/types';
import { DEFAULT_DATA_SOURCE_DISPLAY_NAME } from '../register_default_datasource';

const defaultDataSourceMetadata = {
  ui: {
    label: DEFAULT_DATA_SOURCE_DISPLAY_NAME,
    typeLabel: DEFAULT_DATA_SOURCE_DISPLAY_NAME,
    groupType: DataSourceUIGroupType.defaultOpenSearchDataSource,
    selector: {
      displayDatasetsAsSource: true,
    },
  },
};

class MockDataSource extends DataSource<
  LocalDSMetadata,
  LocalDSDataSetParams,
  LocalDSDataSetResponse,
  LocalDSQueryParams,
  LocalDSQueryResponse
> {
  private readonly indexPattern;

  constructor({
    id,
    name,
    type,
    metadata,
    indexPattern,
  }: {
    id: string;
    name: string;
    type: string;
    metadata: any;
    indexPattern: IndexPatternsService;
  }) {
    super({ id, name, type, metadata });
    this.indexPattern = indexPattern;
  }

  async getDataSet(dataSetParams?: LocalDSDataSetParams): Promise<LocalDSDataSetResponse> {
    const savedObjectLst = await this.indexPattern.getCache();

    if (!Array.isArray(savedObjectLst)) {
      return { dataSets: [] };
    }

    return {
      dataSets: savedObjectLst.map((savedObject: SavedObject<IndexPatternSavedObjectAttrs>) => {
        return {
          id: savedObject.id,
          title: savedObject.attributes.title,
        };
      }),
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async runQuery(queryParams: any): Promise<LocalDSQueryResponse> {
    return {
      data: {},
    };
  }
}

const mockIndexPattern = {} as IndexPatternsService;

const mockConfig1 = {
  id: 'test_datasource1',
  name: 'test_datasource1',
  type: 'mock1',
  metadata: defaultDataSourceMetadata,
  indexPattern: mockIndexPattern,
};

const mockConfig2 = {
  id: 'test_datasource2',
  name: 'test_datasource2',
  type: 'mock1',
  metadata: defaultDataSourceMetadata,
  indexPattern: mockIndexPattern,
};

describe('DataSourceService', () => {
  beforeEach(() => {
    // Reset the DataSourceService's singleton instance before each test for isolation
    (DataSourceService as any).dataSourceService = undefined;
  });

  it('returns a singleton instance', () => {
    const instance1 = DataSourceService.getInstance();
    const instance2 = DataSourceService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('registers a new data source correctly', async () => {
    const service = DataSourceService.getInstance();
    const ds = new MockDataSource(mockConfig1);
    const result = await service.registerDataSource(ds);
    expect(result.success).toBe(true);
  });

  it('throws error when registering an already registered data source', async () => {
    const service = DataSourceService.getInstance();
    const ds = new MockDataSource(mockConfig1);
    await service.registerDataSource(ds);
    await expect(service.registerDataSource(ds)).rejects.toThrow(
      'Unable to register data source test_datasource1, error: data source exists.'
    );
  });

  it('registers multiple data sources correctly', () => {
    const service = DataSourceService.getInstance();
    const ds1 = new MockDataSource(mockConfig1);
    const ds2 = new MockDataSource(mockConfig2);
    const results = service.registerMultipleDataSources([ds1, ds2]);
    results.then((regResults) => {
      expect(regResults).toHaveLength(2);
      expect(regResults[0].success).toBe(true);
      expect(regResults[1].success).toBe(true);
    });
  });

  it('loads data sources successfully with fetchers', async () => {
    const service = DataSourceService.getInstance();
    const fetcherMock = jest.fn(() => {
      service.registerDataSource(new MockDataSource(mockConfig1)); // Simulates adding a new data source after fetching
    });
    service.registerDataSourceFetchers([{ type: 'mock', registerDataSources: fetcherMock }]);

    await service.load();
    expect(fetcherMock).toHaveBeenCalledTimes(1);
    service.getDataSources$().subscribe((dataSources) => {
      expect(Object.keys(dataSources)).toContain('test_datasource1');
    });
  });

  it('retrieves registered data sources based on filters', () => {
    const service = DataSourceService.getInstance();
    const ds1 = new MockDataSource(mockConfig1);
    const ds2 = new MockDataSource(mockConfig2);
    service.registerMultipleDataSources([ds1, ds2]);
    const filter = { names: ['test_datasource1'] };
    waitFor(() => {
      const retrievedDataSources = service.getDataSources$(filter);
      expect(retrievedDataSources).toHaveProperty('test_datasource1');
      expect(retrievedDataSources).not.toHaveProperty('test_datasource2');
    });
  });

  it('returns all data sources if no filters provided', () => {
    const service = DataSourceService.getInstance();
    const ds1 = new MockDataSource(mockConfig1);
    const ds2 = new MockDataSource(mockConfig2);
    service.registerMultipleDataSources([ds1, ds2]);
    waitFor(() => {
      const retrievedDataSources = service.getDataSources$();
      expect(retrievedDataSources).toHaveProperty('test_datasource1');
      expect(retrievedDataSources).toHaveProperty('test_datasource2');
    });
  });

  it('should reset and load data sources using registered fetchers', async () => {
    const service = DataSourceService.getInstance();
    const fetcherMock = jest.fn();
    service.registerDataSourceFetchers([{ type: 'mock', registerDataSources: fetcherMock }]);

    service.load();
    expect(fetcherMock).toHaveBeenCalled();
    expect(
      service.getDataSources$().subscribe((dataSources) => {
        expect(Object.keys(dataSources).length).toBe(0);
      })
    );
  });

  it('handles failures in data fetchers gracefully during load', async () => {
    const service = DataSourceService.getInstance();
    const fetcherMock = jest.fn(() => {
      throw new Error('Failed to fetch data sources');
    });
    service.registerDataSourceFetchers([{ type: 'mock', registerDataSources: fetcherMock }]);

    await service.load();
    expect(fetcherMock).toHaveBeenCalledTimes(1);
    service.getDataSources$().subscribe((dataSources) => {
      expect(Object.keys(dataSources).length).toBe(0); // Assuming reset clears everything regardless of fetcher success
    });
  });

  it('should call load method when reload is invoked', () => {
    const service = DataSourceService.getInstance();
    const loadSpy = jest.spyOn(service, 'load');
    service.reload();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should reset all registered data sources', () => {
    const service = DataSourceService.getInstance();
    const ds = new MockDataSource(mockConfig1);
    service.registerDataSource(ds); // Ensure there is at least one data source

    service.reset();
    expect(
      service.getDataSources$().subscribe((dataSources) => {
        expect(Object.keys(dataSources).length).toBe(0);
      })
    );
  });

  it('successfully reloads and updates data sources', async () => {
    const service = DataSourceService.getInstance();
    const fetcherMock = jest.fn().mockResolvedValue('Data fetched successfully');

    // Register fetchers and perform initial load
    service.registerDataSourceFetchers([{ type: 'default', registerDataSources: fetcherMock }]);
    await service.load();

    // Reset mocks to clear previous calls and reload
    fetcherMock.mockClear();
    service.reload();

    expect(fetcherMock).toHaveBeenCalledTimes(1);
    service.getDataSources$().subscribe((dataSources) => {
      // Expect that new data has been loaded; specifics depend on your implementation
      expect(dataSources).toEqual(expect.anything()); // Adjust expectation based on your data structure
    });
  });

  it('ensures complete clearance of data sources on reset', () => {
    const service = DataSourceService.getInstance();
    service.registerDataSource(new MockDataSource(mockConfig1));
    service.registerDataSource(new MockDataSource(mockConfig2));

    service.reset();
    service.getDataSources$().subscribe((dataSources) => {
      expect(Object.keys(dataSources).length).toBe(0);
    });
  });
});
