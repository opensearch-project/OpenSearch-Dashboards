/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiContextMenuPanelDescriptor } from '@elastic/eui';
import { buildContextMenuForActions } from './build_eui_context_menu_panels';
import { Action, createAction } from '../actions';

const createTestAction = ({
  type,
  dispayName,
  order,
  grouping,
}: {
  type?: string;
  dispayName: string;
  order?: number;
  grouping?: any[];
}) =>
  createAction({
    type: type as any, // mapping doesn't matter for this test
    getDisplayName: () => dispayName,
    order,
    execute: async () => {},
    grouping,
  });

const resultMapper = (panel: EuiContextMenuPanelDescriptor) => ({
  items: panel.items
    ? panel.items.map((item) => ({
        ...(item.name ? { name: item.name } : {}),
        ...(item.isSeparator ? { isSeparator: true } : {}),
      }))
    : [],
});

test('sorts items in DESC order by "order" field first, then by display name', async () => {
  const actions: Action[] = [
    createTestAction({
      order: 1,
      type: 'foo',
      dispayName: 'a-1',
    }),
    createTestAction({
      order: 2,
      type: 'foo',
      dispayName: 'a-2',
    }),
    createTestAction({
      order: 3,
      type: 'foo',
      dispayName: 'a-3',
    }),
    createTestAction({
      order: 2,
      type: 'foo',
      dispayName: 'b-2',
    }),
    createTestAction({
      order: 2,
      type: 'foo',
      dispayName: 'c-2',
    }),
  ].sort(() => 0.5 - Math.random());

  const result = await buildContextMenuForActions({
    actions: actions.map((action) => ({ action, context: {}, trigger: '' as any })),
  });

  expect(result.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [
          Object {
            "name": "a-3",
          },
          Object {
            "name": "a-2",
          },
          Object {
            "name": "b-2",
          },
          Object {
            "name": "More",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "c-2",
          },
          Object {
            "name": "a-1",
          },
        ],
      },
    ]
  `);
});

test('builds empty menu when no actions provided', async () => {
  const menu = await buildContextMenuForActions({
    actions: [],
    closeMenu: () => {},
  });

  expect(menu.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [],
      },
    ]
  `);
});

test('can build menu with one action', async () => {
  const menu = await buildContextMenuForActions({
    actions: [
      {
        action: createTestAction({
          dispayName: 'Foo',
        }),
        context: {},
        trigger: 'TETS_TRIGGER' as any,
      },
    ],
    closeMenu: () => {},
  });

  expect(menu.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [
          Object {
            "name": "Foo",
          },
        ],
      },
    ]
  `);
});

test('orders items according to "order" field', async () => {
  const actions = [
    createTestAction({
      order: 1,
      dispayName: 'Foo',
    }),
    createTestAction({
      order: 2,
      dispayName: 'Bar',
    }),
  ];
  const menu = await buildContextMenuForActions({
    actions: actions.map((action) => ({ action, context: {}, trigger: 'TEST' as any })),
  });

  expect(menu[0].items![0].name).toBe('Bar');
  expect(menu[0].items![1].name).toBe('Foo');

  const actions2 = [
    createTestAction({
      order: 2,
      dispayName: 'Bar',
    }),
    createTestAction({
      order: 1,
      dispayName: 'Foo',
    }),
  ];
  const menu2 = await buildContextMenuForActions({
    actions: actions2.map((action) => ({ action, context: {}, trigger: 'TEST' as any })),
  });

  expect(menu2[0].items![0].name).toBe('Bar');
  expect(menu2[0].items![1].name).toBe('Foo');
});

test('hides items behind in "More" submenu if there are more than 4 actions', async () => {
  const actions = [
    createTestAction({
      dispayName: 'Foo 1',
    }),
    createTestAction({
      dispayName: 'Foo 2',
    }),
    createTestAction({
      dispayName: 'Foo 3',
    }),
    createTestAction({
      dispayName: 'Foo 4',
    }),
    createTestAction({
      dispayName: 'Foo 5',
    }),
  ];
  const menu = await buildContextMenuForActions({
    actions: actions.map((action) => ({ action, context: {}, trigger: 'TEST' as any })),
  });

  expect(menu.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [
          Object {
            "name": "Foo 1",
          },
          Object {
            "name": "Foo 2",
          },
          Object {
            "name": "Foo 3",
          },
          Object {
            "name": "More",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Foo 4",
          },
          Object {
            "name": "Foo 5",
          },
        ],
      },
    ]
  `);
});

test('flattening of group with only one action', async () => {
  const grouping1 = [
    {
      id: 'test-group',
      getDisplayName: () => 'Test group',
      getIconType: () => 'bell',
    },
  ];
  const actions = [
    createTestAction({
      dispayName: 'Foo 1',
    }),
    createTestAction({
      dispayName: 'Bar 1',
      grouping: grouping1,
    }),
  ];
  const menu = await buildContextMenuForActions({
    actions: actions.map((action) => ({ action, context: {}, trigger: 'TEST' as any })),
  });

  expect(menu.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [
          Object {
            "name": "Foo 1",
          },
          Object {
            "isSeparator": true,
          },
          Object {
            "name": "Bar 1",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Bar 1",
          },
        ],
      },
    ]
  `);
});

test('grouping with only two actions', async () => {
  const grouping1 = [
    {
      id: 'test-group',
      getDisplayName: () => 'Test group',
      getIconType: () => 'bell',
    },
  ];
  const actions = [
    createTestAction({
      dispayName: 'Foo 1',
    }),
    createTestAction({
      dispayName: 'Bar 1',
      grouping: grouping1,
    }),
    createTestAction({
      dispayName: 'Bar 2',
      grouping: grouping1,
    }),
  ];
  const menu = await buildContextMenuForActions({
    actions: actions.map((action) => ({ action, context: {}, trigger: 'TEST' as any })),
  });

  expect(menu.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [
          Object {
            "name": "Foo 1",
          },
          Object {
            "isSeparator": true,
          },
          Object {
            "name": "Test group",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Bar 1",
          },
          Object {
            "name": "Bar 2",
          },
        ],
      },
    ]
  `);
});

test('groups with deep nesting', async () => {
  const grouping1 = [
    {
      id: 'test-group',
      getDisplayName: () => 'Test group',
      getIconType: () => 'bell',
    },
  ];
  const grouping2 = [
    {
      id: 'test-group-2',
      getDisplayName: () => 'Test group 2',
      getIconType: () => 'bell',
    },
    {
      id: 'test-group-3',
      getDisplayName: () => 'Test group 3',
      getIconType: () => 'bell',
    },
  ];

  const actions = [
    createTestAction({
      dispayName: 'Foo 1',
    }),
    createTestAction({
      dispayName: 'Bar 1',
      grouping: grouping1,
    }),
    createTestAction({
      dispayName: 'Bar 2',
      grouping: grouping1,
    }),
    createTestAction({
      dispayName: 'Qux 1',
      grouping: grouping2,
    }),
  ];
  const menu = await buildContextMenuForActions({
    actions: actions.map((action) => ({ action, context: {}, trigger: 'TEST' as any })),
  });

  expect(menu.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [
          Object {
            "name": "Foo 1",
          },
          Object {
            "isSeparator": true,
          },
          Object {
            "name": "Test group",
          },
          Object {
            "isSeparator": true,
          },
          Object {
            "name": "Test group 3",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Bar 1",
          },
          Object {
            "name": "Bar 2",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Test group 3",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Qux 1",
          },
        ],
      },
    ]
  `);
});

// Tests with:
// a regular action
// a group with 2 actions uncategorized
// a group with 2 actions with a category of "test-category" and low order of 10
// a group with 1 actions with a category of "test-category" and high order of 20
test('groups with categories and order', async () => {
  const grouping1 = [
    {
      id: 'test-group',
      getDisplayName: () => 'Test group',
      getIconType: () => 'bell',
    },
  ];
  const grouping2 = [
    {
      id: 'test-group-2',
      getDisplayName: () => 'Test group 2',
      getIconType: () => 'bell',
      category: 'test-category',
      order: 10,
    },
  ];
  const grouping3 = [
    {
      id: 'test-group-3',
      getDisplayName: () => 'Test group 3',
      getIconType: () => 'bell',
      category: 'test-category',
      order: 20,
    },
  ];

  const actions = [
    createTestAction({
      dispayName: 'Foo 1',
    }),
    createTestAction({
      dispayName: 'Bar 1',
      grouping: grouping1,
    }),
    createTestAction({
      dispayName: 'Bar 2',
      grouping: grouping1,
    }),
    createTestAction({
      dispayName: 'Qux 1',
      grouping: grouping2,
    }),
    createTestAction({
      dispayName: 'Qux 2',
      grouping: grouping2,
    }),
    // It is expected that, because there is only 1 action within this group,
    // it will be added to the mainMenu as a single item, but next to other
    // groups of the same category. When a group has a category, but only one
    // item, we just add that single item; otherwise, we add a link to the group
    createTestAction({
      dispayName: 'Waldo 1',
      grouping: grouping3,
    }),
  ];
  const menu = await buildContextMenuForActions({
    actions: actions.map((action) => ({ action, context: {}, trigger: 'TEST' as any })),
  });

  expect(menu.map(resultMapper)).toMatchInlineSnapshot(`
    Array [
      Object {
        "items": Array [
          Object {
            "name": "Foo 1",
          },
          Object {
            "isSeparator": true,
          },
          Object {
            "name": "Test group",
          },
          Object {
            "isSeparator": true,
          },
          Object {
            "name": "Waldo 1",
          },
          Object {
            "name": "Test group 2",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Bar 1",
          },
          Object {
            "name": "Bar 2",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Qux 1",
          },
          Object {
            "name": "Qux 2",
          },
        ],
      },
      Object {
        "items": Array [
          Object {
            "name": "Waldo 1",
          },
        ],
      },
    ]
  `);
});
