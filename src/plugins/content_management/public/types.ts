/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';

import { ContentManagementService, Page } from './services';
import { EmbeddableSetup, EmbeddableStart } from '../../embeddable/public';

export interface ContentManagementPluginSetup {
  registerPage: ContentManagementService['registerPage'];
  getPage: ContentManagementService['getPage'];
}
export interface ContentManagementPluginStart {
  getPage: ContentManagementService['getPage'];
  renderPage: (page: Page) => React.ReactNode;
}

export type ContentManagementPluginStartDependencies = {
  embeddable: EmbeddableStart;
};

export type ContentManagementPluginSetupDependencies = {
  embeddable: EmbeddableSetup;
};

export type ContentServices = CoreStart & ContentManagementPluginStartDependencies;
