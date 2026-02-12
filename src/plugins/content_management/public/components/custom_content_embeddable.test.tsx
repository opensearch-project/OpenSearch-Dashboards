/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';

import { CustomContentEmbeddable } from './custom_content_embeddable';

test('CustomContentEmbeddable', async () => {
  const mockRender = jest.fn().mockReturnValue(<span>custom content</span>);
  const embeddable = new CustomContentEmbeddable({ id: 'id', render: mockRender });
  const node = document.createElement('div');

  // it render the custom content which content defined by a `render` function
  // Use act() to wait for React 18's async rendering with createRoot
  await act(async () => {
    embeddable.render(node);
  });
  expect(
    Array.from(node.querySelectorAll('*')).find(
      (ele) => ele.textContent?.trim() === 'custom content'
    )
  ).toBeTruthy();

  await act(async () => {
    embeddable.destroy();
  });
  expect(
    Array.from(node.querySelectorAll('*')).find(
      (ele) => ele.textContent?.trim() === 'custom content'
    )
  ).toBeFalsy();
});
