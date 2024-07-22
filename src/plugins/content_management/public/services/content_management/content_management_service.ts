/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page } from './page';
import { ContentProvider, PageConfig } from './types';

export class ContentManagementService {
  contentProviders: Map<string, ContentProvider> = new Map();
  pages: Map<string, Page> = new Map();
  constructor() {}

  registerPage = (pageConfig: PageConfig) => {
    if (this.pages.has(pageConfig.id)) {
      throw new Error(`Page id exists: ${pageConfig.id}`);
    }

    const page = new Page(pageConfig);
    this.pages.set(pageConfig.id, page);

    if (pageConfig.sections) {
      pageConfig.sections.forEach((section) => {
        page.createSection(section);
      });
    }

    return page;
  };

  getPage = (id: string) => {
    return this.pages.get(id);
  };

  registerContentProvider = (provider: ContentProvider) => {
    if (this.contentProviders.get(provider.id)) {
      throw new Error(`Cannot register content provider with the same id ${provider.id}`);
    }

    this.contentProviders.set(provider.id, provider);

    const targetArea = provider.getTargetArea();
    const [pageId, sectionId] = targetArea.split('/');

    if (!pageId || !sectionId) {
      throw new Error('getTargetArea() should return a string in format {pageId}/{sectionId}');
    }

    const page = this.getPage(pageId);
    if (page) {
      page.addContent(sectionId, provider.getContent());
    }
  };

  setup() {
    return {};
  }

  start() {
    return {};
  }
}
