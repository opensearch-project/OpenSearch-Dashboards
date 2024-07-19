/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';

import { ContentManagementService, ContentProvider } from './services';
import { EmbeddableSetup, EmbeddableStart } from '../../embeddable/public';

export interface ContentManagementPluginSetup {
  registerPage: ContentManagementService['registerPage'];
}
export interface ContentManagementPluginStart {
  /**
   * @experimental this API is experimental and might change in future releases
   */
  registerContentProvider: (provider: ContentProvider) => void;
  renderPage: (id: string) => React.ReactNode;
}

export interface ContentManagementPluginStartDependencies {
  embeddable: EmbeddableStart;
}

export interface ContentManagementPluginSetupDependencies {
  embeddable: EmbeddableSetup;
}

export type ContentServices = CoreStart & ContentManagementPluginStartDependencies;
