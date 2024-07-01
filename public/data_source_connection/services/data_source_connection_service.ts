/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, ToastsSetup } from 'opensearch-dashboards/public';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { API } from '../../../common';

export interface DataSourceConnection {
  id: string;
  title: string;
  endpoint?: string;
  installedPlugins?: string[];
  auth?: any;
}

export class DataSourceConnectionService {
  private selectedConnection$ = new BehaviorSubject<DataSourceConnection | undefined>(undefined);

  public start({ http }: DataSourceConnectionServiceDeps) {
    const getConnections = async () => {
      const path = API.DATA_SOURCE.CONNECTIONS;
      return from(
        http.fetch({
          method: 'GET',
          path,
        })
      );
    };

    const getConnectionById = async (id: string): Promise<Observable<DataSourceConnection>> => {
      const path = `${API.DATA_SOURCE.CONNECTIONS}/${id}`;
      return from(
        http.fetch({
          method: 'GET',
          path,
        })
      );
    };

    const setSelectedConnection = async (id: string | undefined) => {
      if (!id) {
        this.selectedConnection$.next(undefined);
        return;
      }
      return (await getConnectionById(id)).pipe().subscribe((connection) => {
        this.selectedConnection$.next(connection);
      });
    };

    const getSelectedConnection$ = () => {
      return this.selectedConnection$.asObservable();
    };

    return {
      setSelectedConnection,
      getSelectedConnection$,
      getConnections,
      getConnectionById,
    };
  }
}
export interface DataSourceConnectionServiceDeps {
  http: CoreSetup['http'];
  uiSettings: CoreSetup['uiSettings'];
  startServices: Promise<[CoreStart, any, unknown]>;
  toasts: ToastsSetup;
}
export type DataSourceConnectionServiceStart = ReturnType<DataSourceConnectionService['start']>;
