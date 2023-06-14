/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiHorizontalRule,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';
import { PluginPages } from 'src/core/types/plugin_pages';

export interface OverviewCardProps {
  title: string;
  pages: PluginPages[];
  onClick: (url: string) => void;
}

const MAX_ITEM = 4;

export function OverviewCard(props: OverviewCardProps) {
  const { title, pages, onClick } = props;

  const showViewMore = pages && pages.length > MAX_ITEM;
  let pagesToShow = pages;
  if (showViewMore) {
    pagesToShow = pages.slice(0, MAX_ITEM - 1);
    pagesToShow.push({
      title: 'View more...',
      url: '',
      order: 1000,
    });
  }

  return (
    <EuiPanel>
      <EuiTitle size="s">
        <h5>{title}</h5>
      </EuiTitle>
      <EuiHorizontalRule margin="s" />
      <EuiListGroup gutterSize="none" size="s">
        {pagesToShow.map((page) => (
          <EuiListGroupItem
            key={page.title}
            onClick={() => onClick(page.url)}
            label={page.title}
            color="primary"
            size="s"
          />
        ))}
      </EuiListGroup>
    </EuiPanel>
  );
}
