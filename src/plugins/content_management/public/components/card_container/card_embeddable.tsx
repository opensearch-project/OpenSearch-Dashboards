/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { EuiCard, EuiCardProps, EuiToolTip } from '@elastic/eui';

import { Embeddable, EmbeddableInput, IContainer } from '../../../../embeddable/public';

export const CARD_EMBEDDABLE = 'card_embeddable';
export type CardEmbeddableInput = EmbeddableInput & {
  description: string;
  toolTipContent?: string;
  getTitle?: () => React.ReactElement;
  onClick?: () => void;
  getIcon?: () => React.ReactElement;
  getFooter?: () => React.ReactElement;
  cardProps?: Omit<EuiCardProps, 'title' | 'description'>;
};

export class CardEmbeddable extends Embeddable<CardEmbeddableInput> {
  public readonly type = CARD_EMBEDDABLE;
  private node: HTMLElement | null = null;

  constructor(initialInput: CardEmbeddableInput, parent?: IContainer) {
    super(initialInput, {}, parent);
  }

  public render(node: HTMLElement) {
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;

    const cardProps: EuiCardProps = {
      ...this.input.cardProps,
      title: this.input?.getTitle?.() || this.input?.title || '',
      description: (
        <EuiToolTip position="top" content={this.input?.toolTipContent}>
          <>{this.input.description}</>
        </EuiToolTip>
      ),
      onClick: this.input.onClick,
      icon: this.input?.getIcon?.(),
    };

    if (!cardProps.layout || cardProps.layout === 'vertical') {
      cardProps.textAlign = 'left';
      cardProps.footer = this.input?.getFooter?.();
    }

    ReactDOM.render(<EuiCard {...cardProps} />, node);
  }

  public destroy() {
    super.destroy();
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
  }

  public reload() {}
}
