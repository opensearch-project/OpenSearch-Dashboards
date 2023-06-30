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
import { DashboardPanelState } from './application';
import { EmbeddableInput } from './embeddable_plugin';

export interface SerializedPanels {
  [panelId: string]: DashboardPanelState<EmbeddableInput & { [k: string]: unknown }>;
}

export interface SerializedDashboard {
  id?: string;
  timeRestore?: boolean;
  timeTo?: string;
  timeFrom?: string;
  description?: string;
  panels?: SerializedPanels;
  options?: {
    hidePanelTitles: boolean;
    useMargins: boolean;
  };
  uiState?: string;
  lastSavedTitle: string; // TODO: DO WE STILL NEED THIS?
  refreshInterval?: RefreshInterval; // TODO: SHOULD THIS NOT BE OPTIONAL?
  searchSource?: ISearchSource;
  query?: Query;
  filters?: Filter[];
  title?: string;
}

export interface DashboardParams {
  [key: string]: any;
}

type PartialDashboardState = Partial<SerializedDashboard>;

export class Dashboard<TDashboardParams = DashboardParams> {
  public id?: string;
  public timeRestore?: boolean;
  public timeTo: string = '';
  public timeFrom: string = '';
  public description: string = '';
  public panels?: SerializedPanels;
  public options: Record<string, any> = {};
  public uiState: string = '';
  public refreshInterval?: RefreshInterval;
  public searchSource?: ISearchSource;
  public query?: Query;
  public filters?: Filter[];
  public title?: string;
  // TODO: dashboardNew - pass version to dashboard class
  public version = '3.0.0';

  constructor(dashboardState: SerializedDashboard = {} as any) {}

  async setState(state: PartialDashboardState) {
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
      this.panels = this.getPanels(state.panels);
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
      this.query = this.getQuery(state.query);
    }
    if (state.filters) {
      this.filters = this.getFilters(state.filters);
    }
  }

  private getRefreshInterval(refreshInterval: RefreshInterval) {
    return cloneDeep(refreshInterval ?? {});
  }

  private getQuery(query: Query): Query {
    return cloneDeep(query ?? ({} as Query));
  }

  private getFilters(filters: Filter[]) {
    return cloneDeep(filters ?? ({} as Filter[]));
  }

  private getPanels(panels?: SerializedPanels) {
    return cloneDeep(panels ?? ({} as SerializedPanels));
  }

  /* clone() {
    const serializedDashboard = this.serialize();
    const dashboard = new Dashboard(serializedDashboard);
    dashboard.setState(serializedDashboard);
    return dashboard;
  }*/

  /* serialize(): SerializedDashboard {
    return {
      id: this.id,
      timeRestore: this.timeRestore!,
      timeTo: this.timeTo,
      timeFrom: this.timeFrom,
      description: this.description,
      panels: this.serializePanels(),
      options: cloneDeep(this.options) as any,
      uiState: this.uiState,
      lastSavedTitle: this.lastSavedTitle,
      refreshInterval: this.refreshInterval,
      searchSource: this.searchSource,
      query: this.query,
      filters: this.filters,
      title: this.title!,
    };
  }*/

  /* serializePanels(): SerializedPanels {
    const embeddablesMap: {
      [key: string]: DashboardPanelState;
    } = {};
    this.panels.forEach((panel: SavedDashboardPanel) => {
      embeddablesMap[panel.panelIndex] = convertSavedDashboardPanelToPanelState(panel);
    });
    return embeddablesMap;
  }*/
}
