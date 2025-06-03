/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SectionRender } from './section_render';
import { Content, Section } from '../services';
import { embeddablePluginMock } from '../../../embeddable/public/mocks';
import { coreMock } from '../../../../core/public/mocks';
import { BehaviorSubject } from 'rxjs';
import * as SectionInputExports from './section_input';
import { DashboardContainerInput } from '../../../dashboard/public';
import { ContainerInput } from '../../../embeddable/public';

jest.mock('../../../embeddable/public', () => {
  return {
    ...jest.requireActual('../../../embeddable/public'),
    EmbeddableRenderer: jest.fn().mockImplementation(() => <span>MockEmbeddableRenderer</span>),
  };
});

beforeEach(() => {
  jest.restoreAllMocks();
});

test('it should render custom section', () => {
  const section: Section = {
    id: 'section1',
    kind: 'custom',
    order: 10,
    render: (contents) => (
      <span>
        {contents.map((c) => c.kind === 'custom' && <span key={c.id}>{c.render()}</span>)}
      </span>
    ),
  };
  render(
    <SectionRender
      section={section}
      embeddable={embeddablePluginMock.createStartContract()}
      savedObjectsClient={coreMock.createStart().savedObjects.client}
      contents$={
        new BehaviorSubject<Content[]>([
          { id: 'content1', kind: 'custom', order: 10, render: () => <span>custom content</span> },
        ])
      }
    />
  );
  expect(screen.getByText('custom content')).toBeInTheDocument();
});

test('it should render dashboard section', async () => {
  jest
    .spyOn(SectionInputExports, 'createDashboardInput')
    .mockResolvedValue({} as DashboardContainerInput);

  const section: Section = {
    id: 'section1',
    kind: 'dashboard',
    order: 10,
  };
  const embeddableMock = embeddablePluginMock.createStartContract();

  const factoryMock = jest.fn();
  embeddableMock.getEmbeddableFactory.mockReturnValue(factoryMock as any);

  render(
    <SectionRender
      section={section}
      embeddable={embeddableMock}
      savedObjectsClient={coreMock.createStart().savedObjects.client}
      contents$={
        new BehaviorSubject<Content[]>([
          {
            id: 'content1',
            kind: 'visualization',
            order: 10,
            input: { kind: 'static', id: 'viz-id' },
          },
        ])
      }
    />
  );
  await waitFor(() => expect(screen.getByText('MockEmbeddableRenderer')).toBeInTheDocument());
});

test('it should render card section', async () => {
  jest.spyOn(SectionInputExports, 'createCardInput').mockReturnValue({} as ContainerInput);

  const section: Section = {
    id: 'section1',
    kind: 'card',
    order: 10,
  };
  const embeddableMock = embeddablePluginMock.createStartContract();

  const factoryMock = jest.fn();
  embeddableMock.getEmbeddableFactory.mockReturnValue(factoryMock as any);

  render(
    <SectionRender
      section={section}
      embeddable={embeddableMock}
      savedObjectsClient={coreMock.createStart().savedObjects.client}
      contents$={
        new BehaviorSubject<Content[]>([
          {
            id: 'content1',
            kind: 'card',
            order: 10,
            title: 'title',
            description: 'description',
          },
        ])
      }
    />
  );
  await waitFor(() => expect(screen.getByText('MockEmbeddableRenderer')).toBeInTheDocument());
});
