/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, from } from 'rxjs';
import { API } from '../../../common';
import {
  Connection,
  ConnectionsServiceDeps,
  IConnectionsServiceSetup,
  IConnectionsServiceStart,
} from '../../types';

export class ConnectionsService {
  private selectedConnection$ = new BehaviorSubject<Connection | undefined>(undefined);

  constructor() {}

  public setup(deps: ConnectionsServiceDeps): IConnectionsServiceSetup {
    const getConnections = async (): Promise<Observable<Connection[]>> => {
      return from(
        deps.http.fetch({
          method: 'GET',
          path: API.DATA_SOURCE.CONNECTIONS,
        })
      );
    };

    const getConnectionById = async (id: string): Promise<Observable<Connection>> => {
      const path = `${API.DATA_SOURCE.CONNECTIONS}/${id}`;
      return from(
        deps.http.fetch({
          method: 'GET',
          path,
        })
      );
    };

    const setSelectedConnection = (connection: Connection | undefined) => {
      this.selectedConnection$.next(connection);
    };

    const getSelectedConnection = () => {
      return this.selectedConnection$.asObservable();
    };

    return {
      setSelectedConnection,
      getSelectedConnection,
      getConnections,
      getConnectionById,
    };
  }

  public start(deps: ConnectionsServiceDeps): IConnectionsServiceStart {
    return {};
  }

  public stop() {}
}
