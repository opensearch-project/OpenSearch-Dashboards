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
  registerContentProvider: (provider: ContentProvider) => void;
  renderPage: (id: string) => React.ReactNode;
}

export type ContentManagementPluginStartDependencies = {
  embeddable: EmbeddableStart;
};

export type ContentManagementPluginSetupDependencies = {
  embeddable: EmbeddableSetup;
};

export type ContentServices = CoreStart & ContentManagementPluginStartDependencies;
