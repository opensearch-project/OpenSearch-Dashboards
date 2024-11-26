/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import {
  EuiBreadcrumb,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHighlight,
  EuiIcon,
  EuiSimplifiedBreadcrumbs,
} from '@elastic/eui';
import React from 'react';
import { DevToolApp } from '../dev_tool';
import { UiActionsStart } from '../../../ui_actions/public';
import { DEVTOOL_TRIGGER_ID } from '../plugin';

export const searchForDevTools = async (
  query: string,
  props: {
    devTools: () => readonly DevToolApp[];
    title: string;
    uiActionsApi: () => UiActionsStart;
    callback?: () => void;
  }
): Promise<ReactNode[]> => {
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

  return matchedTools
    .map((tool) => ({
      breadcrumbs: [
        {
          text: devTool,
        },
        /**
         * add onClick to make it looks like a link and don't changed to href,
         * for dev tools, the url will not change, set href will have unexpected behavior
         */
        { text: <EuiHighlight search={query}>{tool.title}</EuiHighlight>, onClick: () => {} },
      ],
      toolId: tool.id,
    }))
    .map((item) => {
      return (
        <DevToolItem
          uiActionsApi={props.uiActionsApi()}
          callback={props.callback}
          breadcrumbs={item.breadcrumbs}
          toolId={item.toolId}
        />
      );
    });
};

export const DevToolItem = ({
  breadcrumbs,
  toolId,
  callback,
  uiActionsApi,
}: {
  breadcrumbs: EuiBreadcrumb[];
  toolId: string;
  callback?: () => void;
  uiActionsApi: UiActionsStart;
}) => {
  return (
    <div
      onClick={() => {
        callback?.();
        uiActionsApi.getTrigger(DEVTOOL_TRIGGER_ID).exec({ defaultRoute: toolId });
      }}
      aria-hidden={true}
      data-test-subj={`toolId-${toolId}`}
    >
      <EuiSimplifiedBreadcrumbs breadcrumbs={breadcrumbs} hideTrailingSeparator />
    </div>
  );
};
