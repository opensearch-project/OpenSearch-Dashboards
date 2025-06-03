/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Container, EmbeddableStart } from '../../../../embeddable/public';
import { CardList } from './card_list';
import { CardContainerInput } from './types';

export const CARD_CONTAINER = 'CARD_CONTAINER';

export class CardContainer extends Container<{}, CardContainerInput> {
  public readonly type = CARD_CONTAINER;
  private node?: HTMLElement;

  constructor(input: CardContainerInput, private embeddableServices: EmbeddableStart) {
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
