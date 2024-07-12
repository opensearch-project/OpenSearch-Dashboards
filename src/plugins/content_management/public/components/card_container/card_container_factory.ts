/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import {
  EmbeddableFactoryDefinition,
  EmbeddableStart,
  EmbeddableFactory,
  ContainerOutput,
} from '../../../../embeddable/public';
import { CARD_CONTAINER, CardContainer, CardContainerInput } from './card_container';

interface StartServices {
  embeddableServices: EmbeddableStart;
}

export type CardContainerFactory = EmbeddableFactory<CardContainerInput, ContainerOutput>;
export class CardContainerFactoryDefinition
  implements EmbeddableFactoryDefinition<CardContainerInput, ContainerOutput> {
  public readonly type = CARD_CONTAINER;
  public readonly isContainerType = true;

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public async isEditable() {
    return false;
  }

  public create = async (initialInput: CardContainerInput) => {
    const { embeddableServices } = await this.getStartServices();
    return new CardContainer(initialInput, embeddableServices);
  };

  public getDisplayName() {
    return i18n.translate('contentManagement.cardContainer.displayName', {
      defaultMessage: 'Card container',
    });
  }
}
