/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { of } from 'rxjs';
import { ToastsSetup } from 'opensearch-dashboards/public';
import { QueryEditorExtensionConfig } from '../../../../../src/plugins/data/public/ui/query_editor';
import { ConfigSchema } from '../../../common/config';
import { ConnectionsBar } from '../components';
import { ConnectionsService } from '../services';

export const createDataSourceConnectionExtension = (
  connectionsService: ConnectionsService,
  toasts: ToastsSetup,
  config: ConfigSchema
): QueryEditorExtensionConfig => {
  return {
    id: 'data-source-connection',
    order: 2000,
    isEnabled$: (dependencies) => {
      return of(true);
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
