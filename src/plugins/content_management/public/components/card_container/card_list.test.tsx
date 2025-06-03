/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';

import { CardList } from './card_list';
import { CardContainer } from './card_container';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { CARD_EMBEDDABLE } from './card_embeddable';

beforeEach(() => {
  jest.restoreAllMocks();
});

test('render list of cards', () => {
  const embeddableStart = embeddablePluginMock.createStartContract();
  jest
    .spyOn(embeddableStart, 'EmbeddablePanel')
    .mockImplementation(() => <span>CardEmbeddablePanel</span>);
  const { container, queryAllByText } = render(
    <CardList
      embeddableServices={embeddableStart}
      embeddable={
        new CardContainer(
          {
            id: 'card',
            panels: {
              'card-id-1': { type: CARD_EMBEDDABLE, explicitInput: { id: 'card-id-1' } },
              'card-id-2': { type: CARD_EMBEDDABLE, explicitInput: { id: 'card-id-2' } },
            },
          },
          embeddableStart
        )
      }
    />
  );
  expect(queryAllByText('CardEmbeddablePanel')).toHaveLength(2);
  // verify container has div with class euiFlexGroup
  expect(container.querySelector('.euiFlexGroup')).toBeInTheDocument();
});

test('render list of cards with grid', () => {
  const embeddableStart = embeddablePluginMock.createStartContract();
  jest
    .spyOn(embeddableStart, 'EmbeddablePanel')
    .mockImplementation(() => <span>CardEmbeddablePanel</span>);
  const { container } = render(
    <CardList
      embeddableServices={embeddableStart}
      embeddable={
        new CardContainer(
          {
            id: 'card',
            panels: {
              'card-id-1': { type: CARD_EMBEDDABLE, explicitInput: { id: 'card-id-1' } },
              'card-id-2': { type: CARD_EMBEDDABLE, explicitInput: { id: 'card-id-2' } },
              'card-id-3': { type: CARD_EMBEDDABLE, explicitInput: { id: 'card-id-3' } },
              'card-id-4': { type: CARD_EMBEDDABLE, explicitInput: { id: 'card-id-4' } },
            },
            grid: true,
            columns: 2,
          },
          embeddableStart
        )
      }
    />
  );
  // verify container has div with class euiFlexGrid
  expect(container.querySelector('.euiFlexGrid')).toBeInTheDocument();
});
