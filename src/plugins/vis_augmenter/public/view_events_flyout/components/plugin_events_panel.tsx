/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexItem, EuiText } from '@elastic/eui';
import './styles.scss';
import { EventVisItem } from './event_vis_item';
import { EventVisEmbeddableItem } from '.';

interface Props {
  pluginTitle: string;
  items: EventVisEmbeddableItem[];
}

export function PluginEventsPanel(props: Props) {
  return (
    <>
      <EuiFlexItem grow={false} style={{ marginBottom: '12px' }}>
        <EuiText size="m" style={{ fontWeight: 'bold' }}>
          {props.pluginTitle}
        </EuiText>
      </EuiFlexItem>

      {props.items.map((item, index) => (
        <EventVisItem key={index} item={item} />
      ))}
    </>
  );
}
