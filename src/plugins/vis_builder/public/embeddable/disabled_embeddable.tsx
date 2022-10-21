/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Embeddable, EmbeddableOutput } from '../../../embeddable/public';

import { DisabledVisualization } from './disabled_visualization';
import { WizardInput, WIZARD_EMBEDDABLE } from './vis_builder_embeddable';

export class DisabledEmbeddable extends Embeddable<WizardInput, EmbeddableOutput> {
  private domNode?: HTMLElement;
  public readonly type = WIZARD_EMBEDDABLE;

  constructor(private readonly title: string, initialInput: WizardInput) {
    super(initialInput, { title });
  }

  public reload() {}
  public render(domNode: HTMLElement) {
    if (this.title) {
      this.domNode = domNode;
      ReactDOM.render(<DisabledVisualization title={this.title} />, domNode);
    }
  }

  public destroy() {
    if (this.domNode) {
      ReactDOM.unmountComponentAtNode(this.domNode);
    }
  }
}
