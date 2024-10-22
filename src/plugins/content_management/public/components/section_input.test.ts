/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../core/public/mocks';
import { Content, Section } from '../services';
import { DASHBOARD_PANEL_WIDTH, createCardInput, createDashboardInput } from './section_input';

test('it should create card section input', () => {
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
    hidePanelActions: true,
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

test('it should create card section input with explicit input specified', () => {
  const section: Section = {
    id: 'section1',
    kind: 'card',
    order: 10,
    input: { title: 'new title', columns: 4 },
  };
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
    title: 'new title',
    hidePanelTitles: true,
    hidePanelActions: true,
    viewMode: 'view',
    columns: 4,
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
  const section: Section = {
    id: 'section1',
    kind: 'dashboard',
    order: 10,
    input: { timeRange: { from: 'now-1d', to: 'now' } },
  };
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

  // with explicit section input
  expect(input.timeRange).toEqual({ from: 'now-1d', to: 'now' });

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
        hidePanelActions: true,
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
        hidePanelActions: true,
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
          '[{"version":"3.0.0","gridData":{"x":0,"y":0,"w":48,"h":5,"i":"i"},"panelIndex":"1","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_0"}]',
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
    '1': {
      explicitInput: {
        id: '1',
        savedObjectId: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2',
      },
      gridData: {
        h: 5,
        i: '1',
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
          '[{"version":"3.0.0","gridData":{"x":0,"y":0,"w":48,"h":5,"i":"1"},"panelIndex":"1","embeddableConfig":{"hidePanelTitles":true},"panelRefName":"panel_0"}]',
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
    '1': {
      explicitInput: {
        id: '1',
        savedObjectId: 'ce24dd10-eb8a-11ed-8e00-17d7d50cd7b2',
      },
      gridData: {
        h: 5,
        i: '1',
        w: 48,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
  });
});

test('it should create section with a dashboard which has duplicate visualization', async () => {
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
    // all three visualization referenced to same object
    get: jest.fn().mockResolvedValue({
      id: 'dashboard-id-static',
      attributes: {
        panelsJSON:
          '[{"version":"3.0.0","gridData":{"x":24,"y":0,"w":24,"h":15,"i":"909ee211-fab3-400f-858a-734e6fb52326"},"panelIndex":"909ee211-fab3-400f-858a-734e6fb52326","embeddableConfig":{},"panelRefName":"panel_0"},{"version":"3.0.0","gridData":{"x":0,"y":0,"w":24,"h":15,"i":"d61bbd24-be5d-4422-a522-096be0d5e711"},"panelIndex":"d61bbd24-be5d-4422-a522-096be0d5e711","embeddableConfig":{},"panelRefName":"panel_1"},{"version":"3.0.0","gridData":{"x":24,"y":15,"w":24,"h":15,"i":"111d18c7-788f-4276-b54c-bd7f78ea768d"},"panelIndex":"111d18c7-788f-4276-b54c-bd7f78ea768d","embeddableConfig":{},"panelRefName":"panel_2"}]',
      },
      references: [
        {
          name: 'panel_0',
          type: 'visualization',
          id: '_Chk-0_10f1a240-b891-11e8-a6d9-e546fe2bba5f',
        },
        {
          name: 'panel_1',
          type: 'visualization',
          id: '_Chk-0_10f1a240-b891-11e8-a6d9-e546fe2bba5f',
        },
        {
          name: 'panel_2',
          type: 'visualization',
          id: '_Chk-0_10f1a240-b891-11e8-a6d9-e546fe2bba5f',
        },
      ],
    }),
  };

  const input = await createDashboardInput(section, [staticDashboard], {
    savedObjectsClient: clientMock,
  });
  // expect we still have 3 panels with same content
  expect(input.panels).toEqual({
    '111d18c7-788f-4276-b54c-bd7f78ea768d': {
      explicitInput: {
        id: '111d18c7-788f-4276-b54c-bd7f78ea768d',
        savedObjectId: '_Chk-0_10f1a240-b891-11e8-a6d9-e546fe2bba5f',
      },
      gridData: { h: 15, i: '111d18c7-788f-4276-b54c-bd7f78ea768d', w: 24, x: 24, y: 15 },
      type: 'visualization',
    },
    '909ee211-fab3-400f-858a-734e6fb52326': {
      explicitInput: {
        id: '909ee211-fab3-400f-858a-734e6fb52326',
        savedObjectId: '_Chk-0_10f1a240-b891-11e8-a6d9-e546fe2bba5f',
      },
      gridData: { h: 15, i: '909ee211-fab3-400f-858a-734e6fb52326', w: 24, x: 24, y: 0 },
      type: 'visualization',
    },
    'd61bbd24-be5d-4422-a522-096be0d5e711': {
      explicitInput: {
        id: 'd61bbd24-be5d-4422-a522-096be0d5e711',
        savedObjectId: '_Chk-0_10f1a240-b891-11e8-a6d9-e546fe2bba5f',
      },
      gridData: { h: 15, i: 'd61bbd24-be5d-4422-a522-096be0d5e711', w: 24, x: 0, y: 0 },
      type: 'visualization',
    },
  });
});

test('it renders content with custom width and height', async () => {
  const customWidth = 24;
  const customHeight = 20;
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const staticViz: Content = {
    id: 'content1',
    kind: 'visualization',
    order: 0,
    width: customWidth,
    height: customHeight,
    input: {
      kind: 'static',
      id: 'viz-id-static',
    },
  };

  const clientMock = coreMock.createStart().savedObjects.client;
  const input = await createDashboardInput(section, [staticViz], {
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
        i: 'content1',
        h: customHeight,
        w: customWidth,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
  });
});

test('it uses default width if custom content width is <= 0', async () => {
  const customWidthShouldBeBiggerThan0 = 0;
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const staticViz: Content = {
    id: 'content1',
    kind: 'visualization',
    order: 0,
    width: customWidthShouldBeBiggerThan0,
    input: {
      kind: 'static',
      id: 'viz-id-static',
    },
  };

  const clientMock = coreMock.createStart().savedObjects.client;
  const input = await createDashboardInput(section, [staticViz], {
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
        w: DASHBOARD_PANEL_WIDTH,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
  });
});

test('it should use default width if custom content width > DASHBOARD_GRID_COLUMN_COUNT: 48', async () => {
  const customWidthShouldNotBeBiggerThan0 = 49;
  const section: Section = { id: 'section1', kind: 'dashboard', order: 10 };
  const staticViz: Content = {
    id: 'content1',
    kind: 'visualization',
    order: 0,
    width: customWidthShouldNotBeBiggerThan0,
    input: {
      kind: 'static',
      id: 'viz-id-static',
    },
  };

  const clientMock = coreMock.createStart().savedObjects.client;
  const input = await createDashboardInput(section, [staticViz], {
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
        w: DASHBOARD_PANEL_WIDTH,
        x: 0,
        y: 0,
      },
      type: 'visualization',
    },
  });
});
