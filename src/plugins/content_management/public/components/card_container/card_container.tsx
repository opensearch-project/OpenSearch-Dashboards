/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot, Root } from 'react-dom/client';
import { Container, EmbeddableStart } from '../../../../embeddable/public';
import { CardList } from './card_list';
import { CardContainerInput } from './types';

export const CARD_CONTAINER = 'CARD_CONTAINER';

export class CardContainer extends Container<{}, CardContainerInput> {
  public readonly type = CARD_CONTAINER;
  private root?: Root;

  constructor(input: CardContainerInput, private embeddableServices: EmbeddableStart) {
    super(input, { embeddableLoaded: {} }, embeddableServices.getEmbeddableFactory);
  }

  getInheritedInput() {
    return {
      viewMode: this.input.viewMode,
    };
  }

  public render(_node: HTMLElement) {
    if (this.root) {
      this.root.unmount();
    }
    // @ts-expect-error TS2339 TODO(ts-error): fixme
    this._node = _node;
    this.root = createRoot(_node);
    this.root.render(<CardList embeddable={this} embeddableServices={this.embeddableServices} />);
  }

  public destroy() {
    super.destroy();
    if (this.root) {
      this.root.unmount();
    }
  }
}
