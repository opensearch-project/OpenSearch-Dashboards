/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React from 'react';
import { EuiTabbedContent } from '@elastic/eui';

export interface IExploreTabsProps {
  tabs: Array<{
    id: string;
    name: string;
    content: React.JSX.Element;
  }>;
}

/**
 * Rendering tabs with different views of 1 OpenSearch hit in Discover.
 * The tabs are provided by the `docs_views` registry.
 * A view can contain a React `component`, or any JS framework by using
 * a `render` function.
 */
export const ExploreTabs = ({ tabs }: IExploreTabsProps) => {
  return (
    <EuiTabbedContent className="exploreTabs" data-test-subj="exploreTabs" tabs={tabs} size="s" />
  );
};
