/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Embeddable, EmbeddableInput, IContainer } from '../../../embeddable/public';

export const CUSTOM_CONTENT_RENDER = 'custom_content_render';
export type CustomContentEmbeddableInput = EmbeddableInput & { render: () => React.ReactElement };

export class CustomContentEmbeddable extends Embeddable<CustomContentEmbeddableInput> {
  public readonly type = CUSTOM_CONTENT_RENDER;

  constructor(initialInput: CustomContentEmbeddableInput, parent?: IContainer) {
    super(initialInput, {}, parent);
  }

  public render(node: HTMLElement) {
    console.log(node);
    // node.innerHTML = '<div data-test-subj="helloWorldEmbeddable">HELLO WORLD!</div>';
    ReactDOM.render(this.input.render(), node);
  }

  public reload() {}
}
