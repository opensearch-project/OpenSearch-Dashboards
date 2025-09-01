/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { setServices } from '../application/opensearch_dashboards_services';
import { installSampleDataSet, uninstallSampleDataSet } from './sample_data_client';

const mockHttp = {
  post: jest.fn(),
  delete: jest.fn(),
};

const mockUiSettings = {
  isDefault: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
};

const mockApplication = {
  capabilities: {
    workspaces: {
      enabled: false,
      permissionEnabled: false,
    },
  },
};

const mockIndexPatternService = {
  clearCache: jest.fn(),
};

const mockWorkspace = {
  currentWorkspace$: new BehaviorSubject(),
};

const mockServices = {
  workspaces: mockWorkspace,
  http: mockHttp,
  uiSettings: mockUiSettings,
  application: mockApplication,
  indexPatternService: mockIndexPatternService,
};

setServices(mockServices);

describe('installSampleDataSet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUiSettings.isDefault.mockReturnValue(true);
    setServices(mockServices);
  });

  it('should install the sample data set and set the default index', async () => {
    const id = 'sample-data-id';
    const sampleDataDefaultIndex = 'sample-data-index';
    const dataSourceId = 'data-source-id';

    await installSampleDataSet(id, sampleDataDefaultIndex, dataSourceId);

    expect(mockHttp.post).toHaveBeenCalledWith(`/api/sample_data/${id}`, {
      query: expect.anything(),
    });
    expect(mockUiSettings.set).toHaveBeenCalledWith('defaultIndex', sampleDataDefaultIndex);
    expect(mockIndexPatternService.clearCache).toHaveBeenCalled();
  });

  it('should install the sample data set and not set the default index when workspace is enabled', async () => {
    const id = 'sample-data-id';
    const sampleDataDefaultIndex = 'sample-data-index';
    const dataSourceId = 'data-source-id';

    setServices({
      ...mockServices,
      workspaces: {
        currentWorkspace$: new BehaviorSubject(),
      },
      application: {
        capabilities: {
          workspaces: {
            enabled: true,
            permissionEnabled: true,
          },
        },
      },
    });

    await installSampleDataSet(id, sampleDataDefaultIndex, dataSourceId);

    expect(mockHttp.post).toHaveBeenCalledWith(`/api/sample_data/${id}`, {
      query: expect.anything(),
    });
    expect(mockUiSettings.set).not.toHaveBeenCalled();
    expect(mockIndexPatternService.clearCache).toHaveBeenCalled();
  });
});

describe('uninstallSampleDataSet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUiSettings.isDefault.mockReturnValue(false);
    setServices(mockServices);
  });

  it('should uninstall the sample data set and clear the default index', async () => {
    const id = 'sample-data-id';
    const sampleDataDefaultIndex = 'sample-data-index';
    const dataSourceId = 'data-source-id';

    mockUiSettings.get.mockReturnValue(sampleDataDefaultIndex);

    await uninstallSampleDataSet(id, sampleDataDefaultIndex, dataSourceId);

    expect(mockHttp.delete).toHaveBeenCalledWith(`/api/sample_data/${id}`, {
      query: expect.anything(),
    });
    expect(mockUiSettings.set).toHaveBeenCalledWith('defaultIndex', null);
    expect(mockIndexPatternService.clearCache).toHaveBeenCalled();
  });

  it('should uninstall the sample data set and not clear the default index when workspace is enabled', async () => {
    const id = 'sample-data-id';
    const sampleDataDefaultIndex = 'sample-data-index';
    const dataSourceId = 'data-source-id';

    setServices({
      ...mockServices,
      workspaces: {
        currentWorkspace$: new BehaviorSubject(),
      },
      application: {
        capabilities: {
          workspaces: {
            enabled: true,
            permissionEnabled: true,
          },
        },
      },
    });

    await uninstallSampleDataSet(id, sampleDataDefaultIndex, dataSourceId);

    expect(mockHttp.delete).toHaveBeenCalledWith(`/api/sample_data/${id}`, {
      query: expect.anything(),
    });
    expect(mockUiSettings.set).not.toHaveBeenCalled();
    expect(mockIndexPatternService.clearCache).toHaveBeenCalled();
  });

  it('should uninstall the sample data set and not clear the default index when it is not the sample data index', async () => {
    const id = 'sample-data-id';
    const sampleDataDefaultIndex = 'sample-data-index';
    const dataSourceId = 'data-source-id';

    mockUiSettings.isDefault.mockReturnValue(false);
    mockUiSettings.get.mockReturnValue('other-index');

    await uninstallSampleDataSet(id, sampleDataDefaultIndex, dataSourceId);

    expect(mockHttp.delete).toHaveBeenCalledWith(`/api/sample_data/${id}`, {
      query: expect.anything(),
    });
    expect(mockUiSettings.set).not.toHaveBeenCalled();
    expect(mockIndexPatternService.clearCache).toHaveBeenCalled();
  });
});
