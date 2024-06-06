/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { DataSourceOption } from '../components/data_source_menu/types';

export class DataSourceSelectionService {
  private selectedDataSource$ = new BehaviorSubject(new Map<string, DataSourceOption[]>());
  // Some components may call onSelect function in promise.then, which could be executed later than componentWillUnmount.
  // Use this array to record unmounted component IDs to fallback.
  private removedComponentIds: string[] = [];

  public selectDataSource = (componentId: string, dataSource: DataSourceOption[]) => {
    if (this.removedComponentIds.indexOf(componentId) > -1) {
      return;
    }
    const newMap = new Map(this.selectedDataSource$.value);
    newMap.set(componentId, dataSource);
    this.selectedDataSource$.next(newMap);
  };

  public remove = (componentId: string) => {
    this.removedComponentIds.push(componentId);
    const newMap = new Map(this.selectedDataSource$.value);
    newMap.delete(componentId);
    this.selectedDataSource$.next(newMap);
  };

  public getSelectionValue = () => {
    return this.selectedDataSource$.value;
  };

  // Plugins can use returned subject to subscribe update.
  public getSelection$ = () => {
    return this.selectedDataSource$;
  };
}

// This is an empty instance of DataSourceSelection for fallback.
export const defaultDataSourceSelection = {
  selectDataSource: () => {},
  remove: () => {},
  getSelectionValue: () => {},
  getSelection$: () => {},
};
