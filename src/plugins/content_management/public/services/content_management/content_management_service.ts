/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page } from './page';
import { PageConfig } from './types';

export class ContentManagementService {
  pages: Map<string, Page> = new Map();
  constructor() {}

  registerPage = (pageConfig: PageConfig) => {
    if (this.pages.has(pageConfig.id)) {
      throw new Error(`Page id exists: ${pageConfig.id}`);
    }
    const page = new Page(pageConfig);
    this.pages.set(pageConfig.id, page);
    return page;
  };

  getPage = (id: string) => {
    return this.pages.get(id);
  };

  setup() {
    return {};
  }

  start() {
    return {};
  }
}
