/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

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

  // TODO: we should perhaps display the cards in multiple rows when the actual number of cards exceed the column size
  return (
    <EuiFlexGroup gutterSize="s">
      {input.columns ? cards.slice(0, input.columns) : cards}
    </EuiFlexGroup>
  );
};

export const CardList = withEmbeddableSubscription<
  ContainerInput,
  ContainerOutput,
  IContainer,
  { embeddableServices: EmbeddableStart }
>(CardListInner);
