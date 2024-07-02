/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Container, ContainerInput, EmbeddableStart } from '../../../../embeddable/public';
import { CardList } from './card_list';

export const CARD_CONTAINER = 'CARD_CONTAINER';

export type CardContainerInput = ContainerInput<{ description: string; onClick?: () => void }>;

export class CardContainer extends Container<{}, ContainerInput> {
  public readonly type = CARD_CONTAINER;
  private node?: HTMLElement;

  constructor(input: ContainerInput, private embeddableServices: EmbeddableStart) {
    super(input, { embeddableLoaded: {} }, embeddableServices.getEmbeddableFactory);
  }

  getInheritedInput() {
    return {
      viewMode: this.input.viewMode,
    };
  }

  public render(node: HTMLElement) {
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;
    ReactDOM.render(
      <CardList embeddable={this} embeddableServices={this.embeddableServices} />,
      node
    );
  }

  public destroy() {
    super.destroy();
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
  }
}
