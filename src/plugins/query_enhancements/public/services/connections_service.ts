/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, from } from 'rxjs';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { CoreStart } from 'opensearch-dashboards/public';
import { API } from '../../common';
import { Connection, ConnectionsServiceDeps } from '../types';

export class ConnectionsService {
  protected http!: ConnectionsServiceDeps['http'];
  protected savedObjects!: CoreStart['savedObjects'];
  private uiService$ = new BehaviorSubject<DataPublicPluginStart['ui'] | undefined>(undefined);
  private isDataSourceEnabled = false;
  private isDataSourceEnabled$ = new BehaviorSubject<boolean>(this.isDataSourceEnabled);
  private selectedConnection: Connection | undefined = undefined;
  private selectedConnection$ = new BehaviorSubject<Connection | undefined>(
    this.selectedConnection
  );

  constructor(deps: ConnectionsServiceDeps) {
    deps.startServices.then(([coreStart, depsStart]) => {
      this.http = deps.http;
      this.savedObjects = coreStart.savedObjects;
      this.uiService$.next(depsStart.data.ui);
      this.setIsDataSourceEnabled$(depsStart.dataSource?.dataSourceEnabled || false);
    });
  }

  getSavedObjects = () => {
    return this.savedObjects;
  };

  getIsDataSourceEnabled = () => {
    return this.isDataSourceEnabled;
  };

  setIsDataSourceEnabled$ = (isDataSourceEnabled: boolean) => {
    this.isDataSourceEnabled = isDataSourceEnabled;
    this.isDataSourceEnabled$.next(this.isDataSourceEnabled);
  };

  getIsDataSourceEnabled$ = () => {
    return this.isDataSourceEnabled$.asObservable();
  };

  getUiService = () => {
    return this.uiService$.asObservable();
  };

  getConnections = (): Observable<Connection[]> => {
    return from(
      this.http.fetch({
        method: 'GET',
        path: API.DATA_SOURCE.CONNECTIONS,
      })
    );
  };

  getConnectionById = (id: string): Observable<Connection> => {
    const path = `${API.DATA_SOURCE.CONNECTIONS}/${id}`;
    return from(
      this.http.fetch({
        method: 'GET',
        path,
      })
    );
  };

  getSelectedConnection = () => {
    return this.selectedConnection;
  };

  setSelectedConnection$ = (connection: Connection | undefined) => {
    this.selectedConnection = connection;
    this.selectedConnection$.next(this.selectedConnection);
  };

  getSelectedConnection$ = () => {
    return this.selectedConnection$.asObservable();
  };
}
