/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { get } from 'lodash';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import { getEmbeddable, getCore } from '../../services';
import './styles.scss';
import { EventVisEmbeddableItem } from '.';
import { EventVisItemIcon } from './event_vis_item_icon';

interface Props {
  item: EventVisEmbeddableItem;
}

export function EventVisItem(props: Props) {
  const PanelComponent = getEmbeddable().getEmbeddablePanel();
  const baseUrl = getCore().http.basePath;

  const name = get(props, 'item.visLayer.pluginResource.name', '');
  const urlPath = get(props, 'item.visLayer.pluginResource.urlPath', '');

  return (
    <>
      <EuiFlexGroup direction="row" gutterSize="s">
        <EuiFlexItem
          grow={false}
          className="view-events-flyout__visDescription"
          data-test-subj="pluginResourceDescription"
        >
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem>
              <EuiLink href={`${baseUrl.prepend(`${urlPath}`)}`} target="_blank">
                {name}
              </EuiLink>
            </EuiFlexItem>
            <EventVisItemIcon visLayer={props.item.visLayer} />
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={true} className="view-events-flyout__eventVis" data-test-subj="eventVis">
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
