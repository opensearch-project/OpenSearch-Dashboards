/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PanelDataService, FETCH_PANEL_DATA_TOOL_NAME } from './panel_data_service';

describe('PanelDataService', () => {
  let registerAction: jest.Mock;
  let unregisterAction: jest.Mock;

  const getRegisteredAction = () => {
    // The action object passed to the most recent registerAction call.
    return registerAction.mock.calls[registerAction.mock.calls.length - 1][0];
  };

  beforeEach(() => {
    // Reset the singleton so each test starts from a clean store + unregistered tool.
    (PanelDataService as any).instance = null;

    registerAction = jest.fn();
    unregisterAction = jest.fn();

    PanelDataService.init(registerAction, unregisterAction);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('returns the same instance across calls', () => {
      expect(PanelDataService.getInstance()).toBe(PanelDataService.getInstance());
    });
  });

  describe('setPanelData', () => {
    it('registers the shared tool lazily on the first publish', () => {
      const service = PanelDataService.getInstance();
      expect(registerAction).not.toHaveBeenCalled();

      service.setPanelData('panel-1', { rows: [], panelTitle: 'Panel 1' });

      expect(registerAction).toHaveBeenCalledTimes(1);
      expect(getRegisteredAction().name).toBe(FETCH_PANEL_DATA_TOOL_NAME);
    });

    it('registers the tool only once across multiple publishes', () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', { rows: [], panelTitle: 'Panel 1' });
      service.setPanelData('panel-2', { rows: [], panelTitle: 'Panel 2' });
      service.setPanelData('panel-1', { rows: [{ a: 1 }], panelTitle: 'Panel 1' });

      expect(registerAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetch_panel_data handler', () => {
    it('returns the formatted rows for a known panel', async () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', {
        rows: [{ _source: { host: 'a' } }, { fields: { host: 'b' } }, { host: 'c' }],
        panelTitle: 'Hosts',
      });

      const result = await getRegisteredAction().handler({ savedObjectId: 'panel-1' });

      expect(result).toEqual({
        success: true,
        panelTitle: 'Hosts',
        savedObjectId: 'panel-1',
        rowCount: 3,
        // _source, then fields, then the raw hit fallback.
        rows: [{ host: 'a' }, { host: 'b' }, { host: 'c' }],
      });
    });

    it('returns a not-loaded failure for an unknown panel', async () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', { rows: [], panelTitle: 'Panel 1' });

      const result = await getRegisteredAction().handler({ savedObjectId: 'missing' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('missing');
    });

    it('reflects the latest rows after an overwrite', async () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', { rows: [{ v: 1 }], panelTitle: 'Panel 1' });
      service.setPanelData('panel-1', { rows: [{ v: 2 }, { v: 3 }], panelTitle: 'Panel 1' });

      const result = await getRegisteredAction().handler({ savedObjectId: 'panel-1' });

      expect(result.rowCount).toBe(2);
      expect(result.rows).toEqual([{ v: 2 }, { v: 3 }]);
    });
  });

  describe('removePanelData', () => {
    it('drops the panel data so the handler reports it as unavailable', async () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', { rows: [{ v: 1 }], panelTitle: 'Panel 1' });

      service.removePanelData('panel-1');

      const result = await getRegisteredAction().handler({ savedObjectId: 'panel-1' });
      expect(result.success).toBe(false);
    });

    it('leaves the shared tool registered even after the last panel is removed', () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', { rows: [], panelTitle: 'Panel 1' });

      service.removePanelData('panel-1');

      // No churn: the tool stays registered for the plugin's lifetime.
      expect(unregisterAction).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('clears all data and unregisters the tool', async () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', { rows: [{ v: 1 }], panelTitle: 'Panel 1' });
      service.setPanelData('panel-2', { rows: [{ v: 2 }], panelTitle: 'Panel 2' });

      service.reset();

      expect(unregisterAction).toHaveBeenCalledTimes(1);
      expect(unregisterAction).toHaveBeenCalledWith(FETCH_PANEL_DATA_TOOL_NAME);
      // Store is cleared: the previously captured handler now finds nothing.
      const result = await getRegisteredAction().handler({ savedObjectId: 'panel-1' });
      expect(result.success).toBe(false);
    });

    it('is a no-op unregister when nothing was ever registered', () => {
      const service = PanelDataService.getInstance();

      service.reset();

      expect(unregisterAction).not.toHaveBeenCalled();
    });

    it('re-registers on the next publish after reset', () => {
      const service = PanelDataService.getInstance();
      service.setPanelData('panel-1', { rows: [], panelTitle: 'Panel 1' });
      service.reset();
      registerAction.mockClear();

      service.setPanelData('panel-2', { rows: [], panelTitle: 'Panel 2' });

      expect(registerAction).toHaveBeenCalledTimes(1);
    });
  });
});
