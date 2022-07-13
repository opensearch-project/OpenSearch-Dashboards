/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { Plugin, CoreSetup } from 'opensearch-dashboards/public';
import { DiscoverSetup } from '../../../../../src/plugins/discover/public';

export class DocViewsLinksPlugin implements Plugin<void, void> {
  public setup(core: CoreSetup, { discover }: { discover: DiscoverSetup }) {
    discover.docViewsLinks.addDocViewLink({
      href: 'http://some-url/',
      order: 1,
      label: 'href doc view link',
    });

    discover.docViewsLinks.addDocViewLink({
      generateCb: () => ({
        url: 'http://some-url/',
      }),
      order: 2,
      label: 'generateCb doc view link',
    });

    discover.docViewsLinks.addDocViewLink({
      generateCb: () => ({
        url: 'http://some-url/',
        hide: true,
      }),
      order: 3,
      label: 'generateCbHidden doc view link',
    });
  }

  public start() {}
}
