/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { of } from 'rxjs';
import { QueryEditorExtensionConfig } from '../../../../../src/plugins/data/public/ui/query_editor';
import { ConfigSchema } from '../../../common/config';
import { ConnectionsBar } from '../components';
import { ConnectionsService } from '../services';

export const createDataSourceConnectionExtension = (
  connectionsService: ConnectionsService,
  config: ConfigSchema
): QueryEditorExtensionConfig => {
  return {
    id: 'data-source-connection',
    order: 2000,
    isEnabled$: (dependencies) => {
      return of(true);
    },
    getComponent: (dependencies) => {
      return <ConnectionsBar dependencies={dependencies} connectionsService={connectionsService} />;
    },
  };
};
