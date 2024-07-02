/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { QueryEditorExtensionConfig } from '../../../../../src/plugins/data/public/ui/query_editor';
import { QueryEditorExtensionDependencies } from '../../../../../src/plugins/data/public/ui/query_editor/query_editor_extensions/query_editor_extension';
import { PublicConfig } from '../../plugin';
import { ConnectionsBar } from '../components';
import { IConnectionsServiceSetup } from '../../types';

export const createDataSourceConnectionExtension = (
  connectionsService: IConnectionsServiceSetup,
  config: PublicConfig
): QueryEditorExtensionConfig => {
  return {
    id: 'data-source-connection',
    order: 2000,
    isEnabled: async (dependencies) => {
      return true;
    },
    getComponent: (dependencies) => {
      return (
        <ConnectionsWrapper dependencies={dependencies}>
          <ConnectionsBar dependencies={dependencies} connectionsService={connectionsService} />
        </ConnectionsWrapper>
      );
    },
  };
};

interface ConnectionsWrapperProps {
  dependencies: QueryEditorExtensionDependencies;
  invert?: boolean;
}

const ConnectionsWrapper: React.FC<ConnectionsWrapperProps> = (props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (mounted) setVisible(true);

    return () => {
      mounted = false;
    };
  }, [props]);

  if (!visible) return null;
  return <>{props.children}</>;
};
