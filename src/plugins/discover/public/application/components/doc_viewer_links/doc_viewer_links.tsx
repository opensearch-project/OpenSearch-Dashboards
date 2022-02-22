/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './doc_viewer_links.scss';
import React from 'react';
import { EuiListGroup, EuiListGroupItemProps } from '@elastic/eui';
import { getDocViewsLinksRegistry } from '../../../opensearch_dashboards_services';
import { DocViewLinkRenderProps } from '../../doc_views_links/doc_views_links_types';

export function DocViewerLinks(renderProps: DocViewLinkRenderProps) {
  const listItems = getDocViewsLinksRegistry()
    .getDocViewsLinksSorted()
    .map((item) => {
      const { generateUrlCb, href, ...props } = item;
      const listItem: EuiListGroupItemProps = {
        ...props,
        href: generateUrlCb ? generateUrlCb(renderProps) : href,
      };

      return listItem;
    });

  return (
    <div className="osdDocViewerLinks">
      <EuiListGroup listItems={listItems} />
    </div>
  );
}
