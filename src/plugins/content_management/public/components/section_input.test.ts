/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../core/public/mocks';
import { Content, Section } from '../services';
import { createCardInput, createDashboardInput } from './section_input';

test('it should create input for card section', () => {
  const section: Section = { id: 'section1', kind: 'card', order: 10 };
  const content: Content = {
    id: 'content1',
    kind: 'card',
    order: 0,
    title: 'content title',
    description: 'content description',
  };
  const input = createCardInput(section, [content]);
  expect(input).toEqual({
    id: 'section1',
    title: '',
    hidePanelTitles: true,
    viewMode: 'view',
    panels: {
      content1: {
        type: 'card_embeddable',
        explicitInput: {
          description: 'content description',
          id: 'content1',
          onClick: undefined,
          title: 'content title',
        },
      },
    },
  });
});

test('it should not allow to create card input with non-card section', () => {
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const content: Content = {
    id: 'content1',
    kind: 'card',
    order: 0,
    title: 'content title',
    description: 'content description',
  };
  expect(() => createCardInput(section, [content])).toThrowError();
});

test('card section should not include non-card content', () => {
  const section: Section = { id: 'section1', kind: 'card', order: 10 };
  const content: Content = {
    id: 'content1',
    kind: 'visualization',
    order: 0,
    input: {
      kind: 'static',
      id: 'viz-id',
    },
  };
  const input = createCardInput(section, [content]);
  expect(input).toBe(null);
});

test('it should throw error if creating dashboard input with non-dashboard section', async () => {
  const section: Section = { id: 'section1', kind: 'card', order: 10 };
  const content: Content = {
    id: 'content1',
    kind: 'card',
    order: 0,
    title: 'content title',
    description: 'content description',
  };
  const clientMock = coreMock.createStart().savedObjects.client;
  await expect(
    async () => await createDashboardInput(section, [content], { savedObjectsClient: clientMock })
  ).rejects.toThrowError();
});

test('it should create dashboard input', async () => {
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const staticViz: Content = {
    id: 'content1',
    kind: 'visualization',
    order: 0,
    input: {
      kind: 'static',
      id: 'viz-id-static',
    },
  };

  const dynamicViz: Content = {
    id: 'content2',
    kind: 'visualization',
    order: 10,
    input: {
      kind: 'dynamic',
      get: () => Promise.resolve('viz-id-dynamic'),
    },
  };

  const renderFn = jest.fn();
  const customRender: Content = {
    id: 'content3',
    kind: 'custom',
    order: 20,
    render: renderFn,
  };
  const clientMock = coreMock.createStart().savedObjects.client;
  const input = await createDashboardInput(section, [staticViz, dynamicViz, customRender], {
    savedObjectsClient: clientMock,
  });

  expect(input.panels).toEqual({
    content1: {
      explicitInput: {
        disabledActions: ['togglePanel'],
        id: 'content1',
        savedObjectId: 'viz-id-static',
      },
      gridData: {
        h: 15,
        i: 'content1',
        w: 12,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
    content2: {
      explicitInput: {
        disabledActions: ['togglePanel'],
        id: 'content2',
        savedObjectId: 'viz-id-dynamic',
      },
      gridData: {
        h: 15,
        i: 'content2',
        w: 12,
        x: 12,
        y: 0,
      },
      type: 'visualization',
    },
    content3: {
      explicitInput: {
        disabledActions: ['togglePanel'],
        id: 'content3',
        render: renderFn,
      },
      gridData: {
        h: 15,
        i: 'content3',
        w: 12,
        x: 24,
        y: 0,
      },
      type: 'custom_content_embeddable',
    },
  });
});

test('it should create dashboard input without the content which throws error', async () => {
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const staticViz: Content = {
    id: 'content1',
    kind: 'visualization',
    order: 0,
    input: {
      kind: 'static',
      id: 'viz-id-static',
    },
  };

  const dynamicViz: Content = {
    id: 'content2',
    kind: 'visualization',
    order: 10,
    input: {
      kind: 'dynamic',
      get: () => Promise.reject('error'),
    },
  };

  const renderFn = jest.fn();
  const customRender: Content = {
    id: 'content3',
    kind: 'custom',
    order: 20,
    render: renderFn,
  };
  const clientMock = coreMock.createStart().savedObjects.client;
  const input = await createDashboardInput(section, [staticViz, dynamicViz, customRender], {
    savedObjectsClient: clientMock,
  });

  expect(input.panels).toEqual({
    content1: {
      explicitInput: {
        disabledActions: ['togglePanel'],
        id: 'content1',
        savedObjectId: 'viz-id-static',
      },
      gridData: {
        h: 15,
        i: 'content1',
        w: 12,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
    content3: {
      explicitInput: {
        disabledActions: ['togglePanel'],
        id: 'content3',
        render: renderFn,
      },
      gridData: {
        h: 15,
        i: 'content3',
        w: 12,
        x: 24,
        y: 0,
      },
      type: 'custom_content_embeddable',
    },
  });
});

test('it should create section with a dashboard as content', async () => {
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const staticDashboard: Content = {
    id: 'content1',
    kind: 'dashboard',
    order: 0,
    input: {
      kind: 'static',
      id: 'dashboard-id-static',
    },
  };
  const clientMock = {
    ...coreMock.createStart().savedObjects.client,
    get: jest.fn().mockResolvedValue({
      id: 'dashboard-id-static',
      attributes: {
        panelsJSON:
          '[{"version":"3.0.0","gridData":{"x":0,"y":0,"w":48,"h":5,"i":"debc95ec-7d43-49ee-84c8-95ad7b0b03ea"},"panelIndex":"debc95ec-7d43-49ee-84c8-95ad7b0b03ea","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_0"}]',
      },
      references: [
        { id: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2', name: 'panel_0', type: 'visualization' },
      ],
    }),
  };

  const input = await createDashboardInput(section, [staticDashboard], {
    savedObjectsClient: clientMock,
  });
  expect(input.panels).toEqual({
    'debc95ec-7d43-49ee-84c8-95ad7b0b03ea': {
      explicitInput: {
        id: 'debc95ec-7d43-49ee-84c8-95ad7b0b03ea',
        savedObjectId: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2',
      },
      gridData: {
        h: 5,
        i: 'debc95ec-7d43-49ee-84c8-95ad7b0b03ea',
        w: 48,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
  });
});

test('it should create section with a dynamic dashboard as content', async () => {
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const staticDashboard: Content = {
    id: 'content1',
    kind: 'dashboard',
    order: 0,
    input: {
      kind: 'dynamic',
      get: () => Promise.resolve('dashboard-id-static'),
    },
  };
  const clientMock = {
    ...coreMock.createStart().savedObjects.client,
    get: jest.fn().mockResolvedValue({
      id: 'dashboard-id-static',
      attributes: {
        panelsJSON:
          '[{"version":"3.0.0","gridData":{"x":0,"y":0,"w":48,"h":5,"i":"debc95ec-7d43-49ee-84c8-95ad7b0b03ea"},"panelIndex":"debc95ec-7d43-49ee-84c8-95ad7b0b03ea","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_0"}]',
      },
      references: [
        { id: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2', name: 'panel_0', type: 'visualization' },
      ],
    }),
  };

  const input = await createDashboardInput(section, [staticDashboard], {
    savedObjectsClient: clientMock,
  });
  expect(input.panels).toEqual({
    'debc95ec-7d43-49ee-84c8-95ad7b0b03ea': {
      explicitInput: {
        id: 'debc95ec-7d43-49ee-84c8-95ad7b0b03ea',
        savedObjectId: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2',
      },
      gridData: {
        h: 5,
        i: 'debc95ec-7d43-49ee-84c8-95ad7b0b03ea',
        w: 48,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
  });
});
