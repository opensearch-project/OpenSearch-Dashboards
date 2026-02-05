/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import { Embeddable, EmbeddableInput, IContainer } from '../../../embeddable/public';

export const CUSTOM_CONTENT_EMBEDDABLE = 'custom_content_embeddable';
export type CustomContentEmbeddableInput = EmbeddableInput & { render: () => React.ReactElement };

export class CustomContentEmbeddable extends Embeddable<CustomContentEmbeddableInput> {
  public readonly type = CUSTOM_CONTENT_EMBEDDABLE;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  private node: HTMLElement | null = null;
  private root: Root | null = null;

  constructor(initialInput: CustomContentEmbeddableInput, parent?: IContainer) {
    super(initialInput, {}, parent);
  }

  public render(node: HTMLElement) {
    if (this.root) {
      this.root.unmount();
    }
    this.node = node;
    this.root = createRoot(node);
    this.root.render(this.input.render());
  }

  public destroy() {
    super.destroy();
    if (this.root) {
      this.root.unmount();
    }
  }

  public reload() {}
}
