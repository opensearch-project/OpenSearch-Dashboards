/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * @name Dashboard
 */

import { cloneDeep } from 'lodash';
import { Filter, ISearchSource, Query, RefreshInterval } from '../../data/public';
import { SavedDashboardPanel } from './types';
export interface SerializedDashboard {
  id?: string;
  timeRestore: boolean;
  timeTo?: string;
  timeFrom?: string;
  description?: string;
  panels: SavedDashboardPanel[];
  options?: {
    hidePanelTitles: boolean;
    useMargins: boolean;
  };
  uiState?: string;
  lastSavedTitle: string;
  refreshInterval?: RefreshInterval;
  searchSource?: ISearchSource;
  query: Query;
  filters: Filter[];
  title?: string;
}

export interface DashboardParams {
  [key: string]: any;
}

type PartialDashboardState = Partial<SerializedDashboard>;

export class Dashboard<TDashboardParams = DashboardParams> {
  public id?: string;
  public timeRestore: boolean;
  public timeTo: string = '';
  public timeFrom: string = '';
  public description: string = '';
  public panels?: SavedDashboardPanel[];
  public options: Record<string, any> = {};
  public uiState: string = '';
  public refreshInterval?: RefreshInterval;
  public searchSource?: ISearchSource;
  public query: Query;
  public filters: Filter[];
  public title?: string;
  public version = '3.0.0';
  public isDirty = false;

  constructor(dashboardState: SerializedDashboard = {} as any) {
    this.timeRestore = dashboardState.timeRestore;
    this.query = cloneDeep(dashboardState.query);
    this.filters = cloneDeep(dashboardState.filters);
  }

  setState(state: PartialDashboardState) {
    if (state.id) {
      this.id = state.id;
    }
    if (state.timeRestore) {
      this.timeRestore = state.timeRestore;
    }
    if (state.timeTo) {
      this.timeTo = state.timeTo;
    }
    if (state.timeFrom) {
      this.timeFrom = state.timeFrom;
    }
    if (state.description) {
      this.description = state.description;
    }
    if (state.panels) {
      this.panels = cloneDeep(state.panels);
    }
    if (state.options) {
      this.options = state.options;
    }
    if (state.uiState) {
      this.uiState = state.uiState;
    }
    if (state.lastSavedTitle) {
      this.title = state.lastSavedTitle;
    }
    if (state.refreshInterval) {
      this.refreshInterval = this.getRefreshInterval(state.refreshInterval);
    }
    if (state.searchSource) {
      this.searchSource = state.searchSource;
    }
    if (state.query) {
      this.query = state.query;
    }
    if (state.filters) {
      this.filters = state.filters;
    }
  }

  public setIsDirty(value: boolean) {
    this.isDirty = value;
  }

  private getRefreshInterval(refreshInterval: RefreshInterval) {
    return cloneDeep(refreshInterval ?? {});
  }
}
