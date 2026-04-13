/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { addToDashboard } from './add_to_dashboard';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

jest.mock('../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDashboardVersion: jest.fn(() => ({ version: '2.19.0' })),
}));

jest.mock('../../../../opensearch_dashboards_utils/public', () => ({
  setStateToOsdUrl: jest.fn(
    (_key: string, _state: unknown, _opts: unknown, url: string) => `${url}?_a=encoded`
  ),
}));

const createMockDashboard = (panelsJSON = '[]') => ({
  panelsJSON,
  title: '',
  description: '',
  url: '',
  save: jest.fn().mockResolvedValue('saved-dashboard-id'),
});

const createMockDashboardService = (dashboard: ReturnType<typeof createMockDashboard>) =>
  ({
    dashboardUrlGenerator: {
      createUrl: jest.fn().mockResolvedValue('http://localhost:5601/app/dashboards'),
    },
    getSavedDashboardLoader: () => ({
      get: jest.fn().mockResolvedValue(dashboard),
    }),
  } as any);

describe('addToDashboard', () => {
  const obj = { id: 'agent-traces-1', type: 'agentTraces' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('grid positioning with empty dashboard', () => {
    it('should place panel at (0, 0) on an empty dashboard', async () => {
      const dashboard = createMockDashboard('[]');
      const service = createMockDashboardService(dashboard);

      await addToDashboard(service, obj, 'existing', {});

      const panels = JSON.parse(dashboard.panelsJSON);
      expect(panels).toHaveLength(1);
      expect(panels[0].gridData).toEqual({
        i: 'mock-uuid',
        x: 0,
        y: 0,
        w: 24,
        h: 15,
      });
    });
  });

  describe('grid positioning with existing panels', () => {
    it('should place panel on the same row when space is available', async () => {
      const existingPanels = [
        {
          id: 'existing-1',
          version: '2.19.0',
          type: 'visualization',
          panelIndex: 'p1',
          gridData: { i: 'p1', x: 0, y: 0, w: 24, h: 15 },
        },
      ];
      const dashboard = createMockDashboard(JSON.stringify(existingPanels));
      const service = createMockDashboardService(dashboard);

      await addToDashboard(service, obj, 'existing', {});

      const panels = JSON.parse(dashboard.panelsJSON);
      expect(panels).toHaveLength(2);
      expect(panels[1].gridData.x).toBe(24);
      expect(panels[1].gridData.y).toBe(0);
    });

    it('should place panel on a new row when no space on current row', async () => {
      const existingPanels = [
        {
          id: 'existing-1',
          version: '2.19.0',
          type: 'visualization',
          panelIndex: 'p1',
          gridData: { i: 'p1', x: 0, y: 0, w: 30, h: 15 },
        },
      ];
      const dashboard = createMockDashboard(JSON.stringify(existingPanels));
      const service = createMockDashboardService(dashboard);

      await addToDashboard(service, obj, 'existing', {});

      const panels = JSON.parse(dashboard.panelsJSON);
      expect(panels[1].gridData.x).toBe(0);
      expect(panels[1].gridData.y).toBe(15);
    });
  });

  describe('panel metadata', () => {
    it('should set correct panel properties', async () => {
      const dashboard = createMockDashboard('[]');
      const service = createMockDashboardService(dashboard);

      await addToDashboard(service, obj, 'existing', {});

      const panels = JSON.parse(dashboard.panelsJSON);
      expect(panels[0]).toMatchObject({
        id: 'agent-traces-1',
        type: 'agentTraces',
        version: '2.19.0',
        panelIndex: 'mock-uuid',
      });
    });
  });

  describe('new dashboard mode', () => {
    it('should set dashboard title and description', async () => {
      const dashboard = createMockDashboard('[]');
      const service = createMockDashboardService(dashboard);

      await addToDashboard(service, obj, 'new', {
        newDashboardName: 'My Dashboard',
        createDashboardOptions: {
          isTitleDuplicateConfirmed: false,
          onTitleDuplicate: jest.fn(),
        },
      });

      expect(dashboard.title).toBe('My Dashboard');
      expect(dashboard.description).toBe('The dashboard was created from agent traces');
    });

    it('should generate URL and save with options', async () => {
      const dashboard = createMockDashboard('[]');
      const service = createMockDashboardService(dashboard);
      const saveOptions = {
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: jest.fn(),
      };

      await addToDashboard(service, obj, 'new', {
        newDashboardName: 'Test',
        createDashboardOptions: saveOptions,
      });

      expect(service.dashboardUrlGenerator.createUrl).toHaveBeenCalled();
      expect(dashboard.save).toHaveBeenCalledWith(saveOptions);
    });
  });

  describe('existing dashboard mode', () => {
    it('should save without options', async () => {
      const dashboard = createMockDashboard('[]');
      const service = createMockDashboardService(dashboard);

      await addToDashboard(service, obj, 'existing', {
        existingDashboardId: 'dash-123',
      });

      expect(dashboard.save).toHaveBeenCalledWith();
    });
  });

  describe('error handling', () => {
    it('should throw when dashboard loading fails', async () => {
      const service = {
        dashboardUrlGenerator: { createUrl: jest.fn() },
        getSavedDashboardLoader: () => ({
          get: jest.fn().mockRejectedValue(new Error('Not found')),
        }),
      } as any;

      await expect(addToDashboard(service, obj, 'existing', {})).rejects.toThrow(
        'Fail to get dashboard'
      );
    });
  });
});
