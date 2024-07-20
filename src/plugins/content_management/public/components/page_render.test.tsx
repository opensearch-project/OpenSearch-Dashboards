/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { coreMock } from '../../../../core/public/mocks';
import { PageRender } from './page_render';
import { Page } from '../services';
import { embeddablePluginMock } from '../../../embeddable/public/mocks';

jest.mock('./section_render', () => {
  return {
    ...jest.requireActual('./section_render'),
    SectionRender: jest.fn().mockReturnValue(<span>MockSectionRender</span>),
  };
});

test('it should render the sections', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 's1', kind: 'card', order: 10 });
  page.createSection({ id: 's2', kind: 'custom', order: 10, render: jest.fn() });
  page.createSection({ id: 's3', kind: 'dashboard', order: 10 });

  render(
    <PageRender
      page={page}
      embeddable={embeddablePluginMock.createStartContract()}
      savedObjectsClient={coreMock.createStart().savedObjects.client}
    />
  );

  expect(screen.queryAllByText('MockSectionRender')).toHaveLength(3);
});
