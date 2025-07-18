/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { addToDashboard } from './add_to_dashboard'; // Adjust path as needed
import { setStateToOsdUrl } from '../../../../../opensearch_dashboards_utils/public';
import uuid from 'uuid';

// Mock dependencies
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

jest.mock('../../../../../opensearch_dashboards_utils/public', () => ({
  setStateToOsdUrl: jest.fn((key, state, options, url) => `${url}?mocked=true`),
}));

jest.mock('../../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDashboardVersion: jest.fn().mockReturnValue('1.0'),
}));

describe('addToDashboard', () => {
  const mockSave = jest.fn();
  const mockGet = jest.fn();
  const mockCreateUrl = jest.fn();

  const dashboardService = {
    dashboardUrlGenerator: {
      createUrl: mockCreateUrl,
    },
    getSavedDashboardLoader: () => ({
      get: mockGet,
    }),
  };

  const mockDashboardBase = {
    save: mockSave,
    panelsJSON: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (uuid.v4 as jest.Mock).mockReturnValue('mock-panel-id');
  });

  it('adds to an existing dashboard correctly', async () => {
    mockGet.mockResolvedValue({
      ...mockDashboardBase,
      panelsJSON: JSON.stringify([
        {
          id: 'abc',
          type: 'visualization',
          panelIndex: '1',
          version: '1',
          gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
        },
      ]),
    });

    await addToDashboard(dashboardService as any, { id: 'new-viz', type: 'lens' }, 'existing', {
      existingDashboardId: '123',
    });

    expect(mockGet).toHaveBeenCalledWith('123');
    expect(mockSave).toHaveBeenCalled();
  });

  it('creates a new dashboard with correct panel and URL', async () => {
    mockGet.mockResolvedValue({
      ...mockDashboardBase,
      panelsJSON: '[]',
    });

    mockCreateUrl.mockResolvedValue('http://fakenews.co');

    await addToDashboard(dashboardService as any, { id: 'new-viz', type: 'lens' }, 'new', {
      newDashboardName: 'My Dashboard',
      createDashboardOptions: {
        isTitleDuplicateConfirmed: true,
        onTitleDuplicate: jest.fn(),
      },
    });

    expect(mockCreateUrl).toHaveBeenCalled();
    expect(setStateToOsdUrl).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });
});
