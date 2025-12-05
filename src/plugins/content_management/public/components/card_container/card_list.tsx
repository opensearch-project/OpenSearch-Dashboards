/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGrid, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import { FlexGridColumns } from '@elastic/eui/src/components/flex/flex_grid';
import {
  IContainer,
  withEmbeddableSubscription,
  ContainerInput,
  ContainerOutput,
  EmbeddableStart,
} from '../../../../embeddable/public';
import { CardContainerInput } from './types';

interface Props {
  embeddable: IContainer;
  input: CardContainerInput;
  embeddableServices: EmbeddableStart;
}

const CardListInner = ({ embeddable, input, embeddableServices }: Props) => {
  if (input.columns && !input.grid) {
    const width = `${(1 / input.columns) * 100}%`;
    const cards = Object.values(input.panels).map((panel) => {
      const child = embeddable.getChild(panel.explicitInput.id);
      return (
        <EuiFlexItem key={panel.explicitInput.id} style={{ minWidth: `calc(${width} - 8px)` }}>
          <embeddableServices.EmbeddablePanel
            embeddable={child}
            hideHeader
            hasBorder={false}
            hasShadow={false}
          />
        </EuiFlexItem>
      );
    });
    return (
      <EuiFlexGroup
        wrap={!!input.wrap}
        style={input.wrap ? {} : { overflowX: 'auto' }}
        gutterSize="m"
      >
        {cards}
      </EuiFlexGroup>
    );
  }

  const cards = Object.values(input.panels).map((panel) => {
    const child = embeddable.getChild(panel.explicitInput.id);
    return (
      <EuiFlexItem key={panel.explicitInput.id}>
        <embeddableServices.EmbeddablePanel
          embeddable={child}
          hideHeader
          hasBorder={false}
          hasShadow={false}
        />
      </EuiFlexItem>
    );
  });

  if (input.grid && input.columns) {
    return (
      <EuiFlexGrid columns={input.columns as FlexGridColumns} gutterSize="m">
        {cards}
      </EuiFlexGrid>
    );
  }

  return (
    <EuiFlexGroup wrap={input.wrap} gutterSize="m">
      {cards}
    </EuiFlexGroup>
  );
};

export const CardList = withEmbeddableSubscription<
  ContainerInput,
  ContainerOutput,
  IContainer,
  { embeddableServices: EmbeddableStart }
>(CardListInner);
