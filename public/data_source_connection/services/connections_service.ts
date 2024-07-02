/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, from } from 'rxjs';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { API } from '../../../common';
import { Connection, ConnectionsServiceDeps } from '../../types';

export class ConnectionsService {
  protected http!: ConnectionsServiceDeps['http'];
  private uiService$ = new BehaviorSubject<DataPublicPluginStart['ui'] | undefined>(undefined);
  private isDataSourceEnabled$ = new BehaviorSubject<boolean>(false);
  private selectedConnection$ = new BehaviorSubject<Connection | undefined>(undefined);

  constructor(deps: ConnectionsServiceDeps) {
    deps.startServices.then(([coreStart, depsStart]) => {
      this.http = deps.http;
      this.isDataSourceEnabled$.next(depsStart.dataSource?.dataSourceEnabled || false);
      this.uiService$.next(depsStart.data.ui);
    });
  }

  getDataSourceEnabled = () => {
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

  setSelectedConnection = (connection: Connection | undefined) => {
    this.selectedConnection$.next(connection);
  };

  getSelectedConnection = () => {
    return this.selectedConnection$.asObservable();
  };
}
