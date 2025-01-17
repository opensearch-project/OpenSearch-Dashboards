/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  QueryEditorExtension,
  QueryEditorExtensionConfig,
  QueryEditorExtensionDependencies,
} from './query_editor_extension';

interface QueryEditorExtensionsProps extends QueryEditorExtensionDependencies {
  configMap?: Record<string, QueryEditorExtensionConfig>;
  componentContainer: Element;
  bannerContainer: Element;
  bottomPanelContainer: Element;
  queryControlsContainer: Element;
}

const QueryEditorExtensions: React.FC<QueryEditorExtensionsProps> = React.memo((props) => {
  const {
    configMap,
    componentContainer,
    bannerContainer,
    bottomPanelContainer,
    queryControlsContainer,
    ...dependencies
  } = props;

  const sortedConfigs = useMemo(() => {
    if (!configMap || Object.keys(configMap).length === 0) return [];
    return Object.values(configMap).sort((a, b) => a.order - b.order);
  }, [configMap]);

  return (
    <>
      {sortedConfigs.map((config) => {
        const extensionComponentId = `osdQueryEditorExtensionComponent-${config.id}`;
        const extensionQueryControlsId = `osdQueryEditorExtensionQueryControls-${config.id}`;

        // Make sure extension components are rendered in order
        let extensionComponentContainer = document.getElementById(extensionComponentId);
        if (!extensionComponentContainer) {
          extensionComponentContainer = document.createElement('div');
          extensionComponentContainer.className = `osdQueryEditorExtensionComponent osdQueryEditorExtensionComponent__${config.id}`;
          extensionComponentContainer.id = extensionComponentId;
          componentContainer.appendChild(extensionComponentContainer);
        }

        // Make sure extension query controls are rendered in order
        let extensionQueryControlsContainer = document.getElementById(extensionQueryControlsId);
        if (!extensionQueryControlsContainer) {
          extensionQueryControlsContainer = document.createElement('div');
          extensionQueryControlsContainer.className = `osdQueryEditorExtensionQueryControls osdQueryEditorExtensionQueryControls__${config.id}`;
          extensionQueryControlsContainer.id = extensionQueryControlsId;
          queryControlsContainer.appendChild(extensionQueryControlsContainer);
        }

        return (
          <QueryEditorExtension
            key={config.id}
            config={config}
            dependencies={dependencies}
            componentContainer={extensionComponentContainer}
            bannerContainer={bannerContainer}
            bottomPanelContainer={bottomPanelContainer}
            queryControlsContainer={extensionQueryControlsContainer}
          />
        );
      })}
    </>
  );
});

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default QueryEditorExtensions;
