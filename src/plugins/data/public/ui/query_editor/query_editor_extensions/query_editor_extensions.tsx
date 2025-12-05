/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  ACTION_BAR_BUTTONS_CONTAINER_ID,
  QueryEditorExtension,
  QueryEditorExtensionConfig,
  QueryEditorExtensionDependencies,
} from './query_editor_extension';
import { createOrGetExtensionContainer } from './utils';

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
        const extensionComponentContainer = createOrGetExtensionContainer({
          extensionConfigId: config.id,
          containerName: 'osdQueryEditorExtensionComponent',
          parentContainer: componentContainer,
        });

        const extensionQueryControlsContainer = createOrGetExtensionContainer({
          extensionConfigId: config.id,
          containerName: 'osdQueryEditorExtensionQueryControls',
          parentContainer: queryControlsContainer,
        });

        // osdQueryEditorExtensionActionBarContainer styling is within Discovers results_action_bar.scss
        const extensionActionBarContainer = createOrGetExtensionContainer({
          extensionConfigId: config.id,
          containerName: 'osdQueryEditorExtensionActionBarContainer',
          parentContainer: document.getElementById(ACTION_BAR_BUTTONS_CONTAINER_ID),
        });

        return (
          <QueryEditorExtension
            key={config.id}
            config={config}
            dependencies={dependencies}
            componentContainer={extensionComponentContainer}
            bannerContainer={bannerContainer}
            bottomPanelContainer={bottomPanelContainer}
            queryControlsContainer={extensionQueryControlsContainer}
            actionBarContainer={extensionActionBarContainer}
          />
        );
      })}
    </>
  );
});

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default QueryEditorExtensions;
