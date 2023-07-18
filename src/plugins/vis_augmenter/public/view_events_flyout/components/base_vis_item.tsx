/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { getEmbeddable } from '../../services';
import { VisualizeEmbeddable } from '../../../../visualizations/public';
import './styles.scss';

interface Props {
  embeddable: VisualizeEmbeddable;
}

export function BaseVisItem(props: Props) {
  const PanelComponent = getEmbeddable().getEmbeddablePanel();

  return (
    <EuiFlexGroup direction="row" gutterSize="s">
      <EuiFlexItem className="view-events-flyout__visDescription" grow={false} />
      <EuiFlexItem grow={true} className="view-events-flyout__baseVis" data-test-subj="baseVis">
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
