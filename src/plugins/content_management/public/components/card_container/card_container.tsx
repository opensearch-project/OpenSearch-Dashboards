/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Container, EmbeddableStart } from '../../../../embeddable/public';
import { CardList } from './card_list';
import { CardContainerInput } from './types';

export const CARD_CONTAINER = 'CARD_CONTAINER';

export class CardContainer extends Container<{}, CardContainerInput> {
  public readonly type = CARD_CONTAINER;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  private node?: HTMLElement;
  private root?: Root;

  constructor(input: CardContainerInput, private embeddableServices: EmbeddableStart) {
    super(input, { embeddableLoaded: {} }, embeddableServices.getEmbeddableFactory);
  }

  getInheritedInput() {
    return {
      viewMode: this.input.viewMode,
    };
  }

  public render(node: HTMLElement) {
    if (this.root) {
      this.root.unmount();
    }
    this.node = node;
    this.root = createRoot(node);
    this.root.render(<CardList embeddable={this} embeddableServices={this.embeddableServices} />);
  }

  public destroy() {
    super.destroy();
    if (this.root) {
      this.root.unmount();
    }
  }
}
