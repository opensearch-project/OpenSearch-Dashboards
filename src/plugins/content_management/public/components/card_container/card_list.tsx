/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGrid, EuiFlexItem } from '@elastic/eui';

import {
  IContainer,
  withEmbeddableSubscription,
  ContainerInput,
  ContainerOutput,
  EmbeddableStart,
} from '../../../../embeddable/public';

interface Props {
  embeddable: IContainer;
  input: ContainerInput;
  embeddableServices: EmbeddableStart;
}

const CardListInner = ({ embeddable, input, embeddableServices }: Props) => {
  const cards = Object.values(input.panels).map((panel) => {
    const child = embeddable.getChild(panel.explicitInput.id);
    return (
      <EuiFlexItem key={panel.explicitInput.id}>
        <embeddableServices.EmbeddablePanel embeddable={child} />
      </EuiFlexItem>
    );
  });
  return (
    <EuiFlexGrid gutterSize="s" columns={4}>
      {cards}
    </EuiFlexGrid>
  );
};

export const CardList = withEmbeddableSubscription<
  ContainerInput,
  ContainerOutput,
  IContainer,
  { embeddableServices: EmbeddableStart }
>(CardListInner);
