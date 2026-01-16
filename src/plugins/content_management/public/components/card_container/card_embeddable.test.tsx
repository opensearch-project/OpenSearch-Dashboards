/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';
import { CardEmbeddable } from './card_embeddable';

test('CardEmbeddable should render a card with the title', async () => {
  const embeddable = new CardEmbeddable({
    id: 'card-id',
    title: 'card title',
    description: '',
    getIcon: () => <>icon</>,
    getFooter: () => <>footer</>,
  });

  const node = document.createElement('div');

  // Use act() to wait for React 18's async rendering with createRoot
  await act(async () => {
    embeddable.render(node);
  });

  // it should render the card with title specified
  expect(
    Array.from(node.querySelectorAll('*')).find((ele) => ele.textContent?.trim() === 'card title')
  ).toBeTruthy();

  await act(async () => {
    embeddable.destroy();
  });
  expect(
    Array.from(node.querySelectorAll('*')).find((ele) => ele.textContent?.trim() === 'card title')
  ).toBeFalsy();
});

test('CardEmbeddable should render a card with the cardProps', async () => {
  const embeddable = new CardEmbeddable({
    id: 'card-id',
    title: 'card title',
    description: '',
    cardProps: {
      selectable: {
        children: 'selectable line',
        onSelect: () => {},
      },
    },
  });

  const node = document.createElement('div');

  // Use act() to wait for React 18's async rendering with createRoot
  await act(async () => {
    embeddable.render(node);
  });

  // it should render the card with title specified
  expect(
    Array.from(node.querySelectorAll('*')).find(
      (ele) => ele.textContent?.trim() === 'selectable line'
    )
  ).toBeTruthy();

  await act(async () => {
    embeddable.destroy();
  });
  expect(
    Array.from(node.querySelectorAll('*')).find(
      (ele) => ele.textContent?.trim() === 'selectable line'
    )
  ).toBeFalsy();
});
