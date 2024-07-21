/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { CustomContentEmbeddable } from './custom_content_embeddable';

test('CustomContentEmbeddable', () => {
  const mockRender = jest.fn().mockReturnValue(<span>custom content</span>);
  const embeddable = new CustomContentEmbeddable({ id: 'id', render: mockRender });
  const node = document.createElement('div');

  // it render the custom content which content defined by a `render` function
  embeddable.render(node);
  expect(
    Array.from(node.querySelectorAll('*')).find(
      (ele) => ele.textContent?.trim() === 'custom content'
    )
  ).toBeTruthy();

  embeddable.destroy();
  expect(
    Array.from(node.querySelectorAll('*')).find(
      (ele) => ele.textContent?.trim() === 'custom content'
    )
  ).toBeFalsy();
});
