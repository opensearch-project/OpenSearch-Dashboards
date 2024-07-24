/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CUSTOM_CONTENT_EMBEDDABLE, CustomContentEmbeddable } from './custom_content_embeddable';
import { CustomContentEmbeddableFactoryDefinition } from './custom_content_embeddable_factory';

test('create CustomContentEmbeddableFactory', async () => {
  const factory = new CustomContentEmbeddableFactoryDefinition();
  expect(factory.type).toBe(CUSTOM_CONTENT_EMBEDDABLE);
  expect(await factory.isEditable()).toBe(false);
  expect(factory.getDisplayName()).toBe('Content');
  expect(await factory.create({ id: 'id', render: jest.fn() })).toBeInstanceOf(
    CustomContentEmbeddable
  );
});
