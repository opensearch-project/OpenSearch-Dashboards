/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { getEmbeddable } from '../../services';
import './styles.scss';
import { VisualizeEmbeddable } from '../../../../visualizations/public';

interface Props {
  embeddable: VisualizeEmbeddable;
}

export function TimelinePanel(props: Props) {
  const PanelComponent = getEmbeddable().getEmbeddablePanel();
  return (
    <EuiFlexGroup direction="row" gutterSize="s">
      <EuiFlexItem grow={false} className="view-events-flyout__visDescription" />
      <EuiFlexItem
        grow={true}
        className="view-events-flyout__timelinePanel"
        data-test-subj="timelineVis"
      >
        <PanelComponent
          embeddable={props.embeddable}
          hideHeader={true}
          hasBorder={false}
          hasShadow={false}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
