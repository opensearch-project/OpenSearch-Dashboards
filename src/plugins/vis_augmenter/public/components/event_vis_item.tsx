/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiLink, EuiNotificationBadge } from '@elastic/eui';
import { getEmbeddable, getCore } from '../services';
import './styles.scss';
import { EventVisEmbeddableItem } from './';

interface Props {
  item: EventVisEmbeddableItem;
}

export function EventVisItem(props: Props) {
  const PanelComponent = getEmbeddable().getEmbeddablePanel();
  const baseUrl = getCore().http.basePath;
  const { name, urlPath } = props.item.visLayer.pluginResource;

  return (
    <>
      <EuiSpacer size="l" />
      <EuiFlexGroup direction="row" gutterSize="s">
        <EuiFlexItem grow={false} className="view-events-flyout__visDescription">
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem>
              <EuiLink href={`${baseUrl.prepend(`${urlPath}`)}`}>{name}</EuiLink>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiNotificationBadge color="subdued">3</EuiNotificationBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem grow={true} className="view-events-flyout__eventVis">
          <PanelComponent
            embeddable={props.item.embeddable}
            hideHeader={true}
            hasBorder={false}
            hasShadow={false}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
}
