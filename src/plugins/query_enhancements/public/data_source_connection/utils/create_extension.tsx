/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ToastsSetup } from 'opensearch-dashboards/public';
import { QueryEditorExtensionConfig } from '../../../../data/public';
import { ConfigSchema } from '../../../common/config';
import { ConnectionsBar } from '../components';
import { ConnectionsService } from '../services';
import { of } from 'rxjs';

export const createDataSourceConnectionExtension = (
  connectionsService: ConnectionsService,
  toasts: ToastsSetup,
  config: ConfigSchema
): QueryEditorExtensionConfig => {
  return {
    id: 'data-source-connection',
    order: 2000,
    isEnabled$: (dependencies) => {
      return of(false);
    },
    getComponent: (dependencies) => {
      return (
        <ConnectionsBar
          dependencies={dependencies}
          toasts={toasts}
          connectionsService={connectionsService}
        />
      );
    },
  };
};
