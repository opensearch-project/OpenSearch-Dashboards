/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { CARD_CONTAINER, CardContainer } from './card_container';
import { CardContainerFactoryDefinition } from './card_container_factory';

test('CardContainerFactoryDefinition', async () => {
  const getStartServices = jest
    .fn()
    .mockResolvedValue({ embeddableServices: embeddablePluginMock.createStartContract() });
  const factory = new CardContainerFactoryDefinition(getStartServices);
  expect(factory.type).toBe(CARD_CONTAINER);
  expect(factory.isContainerType).toBe(true);
  expect(await factory.isEditable()).toBe(false);
  expect(factory.getDisplayName()).toBe('Card container');
  expect(await factory.create({ id: 'card-id', panels: {} })).toBeInstanceOf(CardContainer);
});
