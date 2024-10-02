/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceDetailCustomizedTabsService } from './workspace_detail_customized_tabs_service';

describe('WorkspaceDetailCustomizedTabsService', () => {
  let service: WorkspaceDetailCustomizedTabsService;

  beforeEach(() => {
    service = new WorkspaceDetailCustomizedTabsService();
  });

  afterEach(() => {
    // @ts-ignore
    service = null;
  });

  it('should return an empty array of tabs initially', () => {
    const tabs$ = service.getCustomizedTabs$();
    tabs$.subscribe((tabs) => {
      expect(tabs).toEqual([]);
    });
  });

  it('should register a new tab', () => {
    const mockTab = {
      id: 'tab-1',
      title: 'Tab 1',
      render: jest.fn(),
      order: 1,
    };

    const unregister = service.registerCustomizedTab(mockTab);

    const tabs$ = service.getCustomizedTabs$();
    tabs$.subscribe((tabs) => {
      expect(tabs).toEqual([mockTab]);
    });

    unregister();

    tabs$.subscribe((tabs) => {
      expect(tabs).toEqual([]);
    });
  });

  it('should sort tabs by order', () => {
    const tab1 = {
      id: 'tab-1',
      title: 'Tab 1',
      render: jest.fn(),
      order: 2,
    };

    const tab2 = {
      id: 'tab-2',
      title: 'Tab 2',
      render: jest.fn(),
      order: 1,
    };

    service.registerCustomizedTab(tab1);
    service.registerCustomizedTab(tab2);

    const tabs$ = service.getCustomizedTabs$();
    tabs$.subscribe((tabs) => {
      expect(tabs).toEqual([tab2, tab1]);
    });
  });

  it('should throw an error for duplicate tab id', () => {
    const tab1 = {
      id: 'tab-1',
      title: 'Tab 1',
      render: jest.fn(),
      order: 1,
    };

    service.registerCustomizedTab(tab1);

    expect(() => {
      service.registerCustomizedTab(tab1);
    }).toThrow('Duplicate tab id: tab-1');
  });

  it('should throw an error for duplicate with predefined tabs', () => {
    const detailsTab = {
      id: 'details',
      title: 'Details',
      render: jest.fn(),
      order: 1,
    };

    expect(() => {
      service.registerCustomizedTab(detailsTab);
    }).toThrow('Duplicate tab id with predefined tabs');
  });

  it('static method getInstance should return same instance', () => {
    expect(WorkspaceDetailCustomizedTabsService.getInstance()).toBe(
      WorkspaceDetailCustomizedTabsService.getInstance()
    );
  });
});
