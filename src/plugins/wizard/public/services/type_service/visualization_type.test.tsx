/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VisualizationTypeOptions } from './types';
import { VisualizationType } from './visualization_type';

// TODO: Update service tests
describe('VisualizationType', () => {
  const DEFAULT_VIZ_PROPS = {
    name: 'some-name',
    icon: 'some-icon',
    title: 'Some Title',
    contributions: {},
  };

  // const createVizType = (props?: Partial<VisualizationTypeOptions>): VisualizationTypeOptions => {
  //   return {
  //     ...DEFAULT_VIZ_PROPS,
  //     ...props,
  //   };
  // };

  // test('should have default container contributions if none are provided', () => {
  //   const viz = new VisualizationType(createVizType());

  //   expect(viz.contributions.containers).toEqual(DEFAULT_CONTAINERS);
  // });

  // test('should have replace default container contributions when provided', () => {
  //   const defaultContainer = DEFAULT_CONTAINERS.sidePanel[0];
  //   const viz = new VisualizationType(
  //     createVizType({
  //       contributions: {
  //         containers: {
  //           sidePanel: [
  //             {
  //               id: defaultContainer.id,
  //               name: 'Test',
  //               Component: <div>Test</div>,
  //             },
  //           ],
  //         },
  //       },
  //     })
  //   );

  //   const container = viz.contributions.containers.sidePanel.find(
  //     ({ id }) => id === defaultContainer.id
  //   );
  //   expect(container).toMatchInlineSnapshot(`
  //     Object {
  //       "Component": <div>
  //         Test
  //       </div>,
  //       "id": "data_tab",
  //       "name": "Test",
  //     }
  //   `);
  // });

  // test('should register new container if provided', () => {
  //   const viz = new VisualizationType(
  //     createVizType({
  //       contributions: {
  //         containers: {
  //           sidePanel: [
  //             {
  //               id: 'test_id',
  //               name: 'Test',
  //               Component: <div>Test</div>,
  //             },
  //           ],
  //         },
  //       },
  //     })
  //   );

  //   const container = viz.contributions.containers.sidePanel.find(({ id }) => id === 'test_id');
  //   const containerNames = viz.contributions.containers.sidePanel.map(({ name }) => name);
  //   const defaultContainerNames = DEFAULT_CONTAINERS.sidePanel.map(({ name }) => name);

  //   expect(containerNames).toEqual([...defaultContainerNames, 'Test']);
  //   expect(container).toMatchInlineSnapshot(`
  //     Object {
  //       "Component": <div>
  //         Test
  //       </div>,
  //       "id": "test_id",
  //       "name": "Test",
  //     }
  //   `);
  // });
});
