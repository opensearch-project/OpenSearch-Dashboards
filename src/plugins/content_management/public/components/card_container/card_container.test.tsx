/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { CardContainer } from './card_container';

jest.mock('./card_list', () => {
  return {
    CardList: jest.fn().mockReturnValue(<span id="mockCardList" />),
  };
});

test('CardContainer should render CardList', () => {
  const container = new CardContainer(
    { id: 'container-id', panels: {} },
    embeddablePluginMock.createStartContract()
  );
  const node = document.createElement('div');
  container.render(node);
  expect(node.querySelector('#mockCardList')).toBeTruthy();

  container.destroy();
  expect(node.querySelector('#mockCardList')).toBeFalsy();
});
