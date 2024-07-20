/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CARD_EMBEDDABLE, CardEmbeddable } from './card_embeddable';
import { CardEmbeddableFactoryDefinition } from './card_embeddable_factory';

test('create CardEmbeddableFactoryDefinition', async () => {
  const factory = new CardEmbeddableFactoryDefinition();
  expect(factory.type).toBe(CARD_EMBEDDABLE);
  expect(factory.getDisplayName()).toBe('Card');
  expect(await factory.isEditable()).toBe(false);
  expect(await factory.create({ id: 'card-id', title: 'title', description: '' })).toBeInstanceOf(
    CardEmbeddable
  );
});
