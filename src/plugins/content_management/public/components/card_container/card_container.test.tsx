/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { CardContainer } from './card_container';

jest.mock('./card_list', () => {
  return {
    CardList: jest.fn().mockReturnValue(<span id="mockCardList" />),
  };
});

test('CardContainer should render CardList', async () => {
  const container = new CardContainer(
    { id: 'container-id', panels: {} },
    embeddablePluginMock.createStartContract()
  );
  const node = document.createElement('div');

  // Use act() to wait for React 18's async rendering with createRoot
  await act(async () => {
    container.render(node);
  });
  expect(node.querySelector('#mockCardList')).toBeTruthy();

  await act(async () => {
    container.destroy();
  });
  expect(node.querySelector('#mockCardList')).toBeFalsy();
});
