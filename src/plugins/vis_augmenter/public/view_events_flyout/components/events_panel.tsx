/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import './styles.scss';
import { EventVisEmbeddableItem, EventVisEmbeddablesMap } from '.';
import { PluginEventsPanel } from './plugin_events_panel';

interface Props {
  eventVisEmbeddablesMap: EventVisEmbeddablesMap;
}

export function EventsPanel(props: Props) {
  return (
    <>
      {Array.from(props.eventVisEmbeddablesMap.keys()).map((key, index) => {
        return (
          <div key={index}>
            {index !== 0 ? <EuiSpacer size="l" /> : null}
            <PluginEventsPanel
              pluginTitle={key}
              items={props.eventVisEmbeddablesMap.get(key) as EventVisEmbeddableItem[]}
            />
          </div>
        );
      })}
    </>
  );
}
