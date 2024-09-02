/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EmbeddableFactoryDefinition, IContainer } from '../../../../embeddable/public';
import { CARD_EMBEDDABLE, CardEmbeddable, CardEmbeddableInput } from './card_embeddable';

export class CardEmbeddableFactoryDefinition implements EmbeddableFactoryDefinition {
  public readonly type = CARD_EMBEDDABLE;

  public async isEditable() {
    return false;
  }

  public async create(initialInput: CardEmbeddableInput, parent?: IContainer) {
    return new CardEmbeddable(initialInput, parent);
  }

  public getDisplayName() {
    return i18n.translate('contentManagement.embeddable.card', {
      defaultMessage: 'Card',
    });
  }
}
