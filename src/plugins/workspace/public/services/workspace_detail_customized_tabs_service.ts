/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { DetailTab } from '../components/workspace_form';

export interface WorkspaceDetailCustomizedTab {
  id: string;
  title: string;
  render: () => React.ReactNode;
  order: number;
}

export class WorkspaceDetailCustomizedTabsService {
  private static _instance: WorkspaceDetailCustomizedTabsService;
  private _tabs$ = new BehaviorSubject<WorkspaceDetailCustomizedTab[]>([]);

  public getCustomizedTabs$() {
    return this._tabs$;
  }

  public registerCustomizedTab(tab: WorkspaceDetailCustomizedTab) {
    if ((Object.values(DetailTab) as string[]).includes(tab.id)) {
      throw new Error('Duplicate tab id with predefined tabs');
    }
    const tabs = this._tabs$.getValue();
    if (tabs.some((existTab) => existTab.id === tab.id)) {
      throw new Error(`Duplicate tab id: ${tab.id}`);
    }
    this._tabs$.next([...tabs, tab].sort((a, b) => a.order - b.order));
    return () => {
      this._tabs$.next(this._tabs$.getValue().filter((existTab) => existTab.id !== tab.id));
    };
  }

  static getInstance() {
    if (!WorkspaceDetailCustomizedTabsService._instance) {
      WorkspaceDetailCustomizedTabsService._instance = new WorkspaceDetailCustomizedTabsService();
    }
    return WorkspaceDetailCustomizedTabsService._instance;
  }
}
