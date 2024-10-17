/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';

import { ContentManagementService, ContentProvider, Page, Section } from './services';
import { EmbeddableSetup, EmbeddableStart } from '../../embeddable/public';

export interface ContentManagementPluginSetup {
  registerPage: ContentManagementService['registerPage'];
}
export interface RenderOptions {
  /**
   * show as fragment not a full page
   */
  fragmentOnly?: boolean;
  /**
   * only render specific section when specified
   */
  sectionId?: string;
}

export interface ContentManagementPluginStart {
  /**
   * @experimental this API is experimental and might change in future releases
   */
  registerContentProvider: (provider: ContentProvider) => void;

  /**
   * @experimental this API is experimental and might change in future releases
   */
  updatePageSection: (
    targetArea: string,
    callback: (section: Section | null, err?: Error) => Section | null
  ) => void;
  /**
   * @experimental this API is experimental and might change in future releases
   */
  getPage: (id: string) => Page | undefined;
  renderPage: (id: string, options?: RenderOptions) => React.ReactNode;
}

export interface ContentManagementPluginStartDependencies {
  embeddable: EmbeddableStart;
}

export interface ContentManagementPluginSetupDependencies {
  embeddable: EmbeddableSetup;
}

export type ContentServices = CoreStart & ContentManagementPluginStartDependencies;
