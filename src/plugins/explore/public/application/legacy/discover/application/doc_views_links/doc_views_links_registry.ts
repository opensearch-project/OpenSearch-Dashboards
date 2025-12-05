/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocViewLink } from './doc_views_links_types';

export class DocViewsLinksRegistry {
  private docViewsLinks: DocViewLink[] = [];

  addDocViewLink(docViewLink: DocViewLink) {
    this.docViewsLinks.push(docViewLink);
  }

  getDocViewsLinksSorted() {
    return this.docViewsLinks.sort((a, b) => (Number(a.order) > Number(b.order) ? 1 : -1));
  }
}
