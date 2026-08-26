/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBreadcrumb,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHighlight,
  EuiIcon,
  EuiSimplifiedBreadcrumbs,
} from '@elastic/eui';
import { GlobalSearchResult } from 'opensearch-dashboards/public';

import { DevToolApp } from '../dev_tool';
import { UiActionsStart } from '../../../ui_actions/public';
import { DEVTOOL_TRIGGER_ID } from '../plugin';

export const searchForDevTools = async (
  query: string,
  props: {
    devTools: () => readonly DevToolApp[];
    title: string;
    uiActionsApi: () => UiActionsStart;
  }
): Promise<GlobalSearchResult[]> => {
  if (!query) {
    return [];
  }

  const tools = props.devTools();

  const devTool = (
    <EuiFlexGroup gutterSize="s" alignItems="center">
      <EuiFlexItem>
        <EuiIcon type="consoleApp" color="text" />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiHighlight search={query}>{props.title}</EuiHighlight>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const titleMatched = props.title.toLowerCase().includes(query.toLowerCase());
  const matchedTools = titleMatched
    ? tools
    : tools.filter((tool) => tool.title.toLowerCase().includes(query.toLowerCase()));

  return matchedTools.map((tool) => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: devTool,
      },
      {
        text: <EuiHighlight search={query}>{tool.title}</EuiHighlight>,
      },
    ];

    return {
      id: tool.id,
      label: tool.title,
      content: <DevToolItem breadcrumbs={breadcrumbs} toolId={tool.id} />,
      execute: () =>
        props.uiActionsApi().getTrigger(DEVTOOL_TRIGGER_ID).exec({ defaultRoute: tool.id }),
    };
  });
};

export const DevToolItem = ({
  breadcrumbs,
  toolId,
}: {
  breadcrumbs: EuiBreadcrumb[];
  toolId: string;
}) => {
  return (
    <div data-test-subj={`toolId-${toolId}`}>
      <EuiSimplifiedBreadcrumbs breadcrumbs={breadcrumbs} hideTrailingSeparator />
    </div>
  );
};
