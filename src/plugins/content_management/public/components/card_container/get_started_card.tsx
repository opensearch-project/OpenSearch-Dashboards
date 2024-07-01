import React from 'react';

import {
  IContainer,
  withEmbeddableSubscription,
  ContainerInput,
  ContainerOutput,
  EmbeddableStart,
} from '../../../../embeddable/public';
import { EuiFlexGrid, EuiFlexItem } from '@elastic/eui';

interface Props {
  embeddable: IContainer;
  input: ContainerInput;
  embeddableServices: EmbeddableStart;
}

const GetStartedCardInner = ({ embeddable, input, embeddableServices }: Props) => {
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

export const GetStartedCard = withEmbeddableSubscription<
  ContainerInput,
  ContainerOutput,
  IContainer,
  { embeddableServices: EmbeddableStart }
>(GetStartedCardInner);
