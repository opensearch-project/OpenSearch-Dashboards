/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import {
  EmbeddableFactoryDefinition,
  ContainerInput,
  EmbeddableStart,
  EmbeddableFactory,
  ContainerOutput,
} from '../../../../embeddable/public';
import { CARD_CONTAINER, CardContainer } from './card_container';

interface StartServices {
  embeddableServices: EmbeddableStart;
}

export type CardContainerFactory = EmbeddableFactory<ContainerInput, ContainerOutput>;
export class CardContainerFactoryDefinition
  implements EmbeddableFactoryDefinition<ContainerInput, ContainerOutput> {
  public readonly type = CARD_CONTAINER;
  public readonly isContainerType = true;

  constructor(private getStartServices: () => Promise<StartServices>) {}

  public async isEditable() {
    return true;
  }

  public create = async (initialInput: ContainerInput) => {
    const { embeddableServices } = await this.getStartServices();
    return new CardContainer(initialInput, embeddableServices);
  };

  public getDisplayName() {
    return i18n.translate('contentManagement.cardContainer.displayName', {
      defaultMessage: 'Card container',
    });
  }
}
