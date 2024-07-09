/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Embeddable, EmbeddableInput, IContainer } from '../../../embeddable/public';

export const CUSTOM_CONTENT_EMBEDDABLE = 'custom_content_embeddable';
export type CustomContentEmbeddableInput = EmbeddableInput & { render: () => React.ReactElement };

export class CustomContentEmbeddable extends Embeddable<CustomContentEmbeddableInput> {
  public readonly type = CUSTOM_CONTENT_EMBEDDABLE;
  private node: HTMLElement | null = null;

  constructor(initialInput: CustomContentEmbeddableInput, parent?: IContainer) {
    super(initialInput, {}, parent);
  }

  public render(node: HTMLElement) {
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;
    ReactDOM.render(this.input.render(), node);
  }

  public destroy() {
    super.destroy();
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
  }

  public reload() {}
}
