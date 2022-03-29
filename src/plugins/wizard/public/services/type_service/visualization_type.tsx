/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { DATA_TAB_ID, DataTab, STYLE_TAB_ID, StyleTab } from '../../application/contributions';
import {
  ContainerLocationContribution,
  ContainerLocations,
  VisualizationTypeOptions,
} from './types';
import { mergeArrays } from './utils';

export const DEFAULT_CONTAINERS: ContainerLocationContribution = {
  sidePanel: [
    {
      id: DATA_TAB_ID,
      name: 'Data',
      Component: <DataTab />,
    },
    {
      id: STYLE_TAB_ID,
      name: 'Style',
      Component: <StyleTab />,
    },
  ],
  toolbar: [],
};

interface IVisualizationType extends Required<VisualizationTypeOptions> {
  contributions: {
    containers: ContainerLocationContribution;
  };
}
export class VisualizationType implements IVisualizationType {
  public readonly name;
  public readonly title;
  public readonly description;
  public readonly icon;
  public readonly stage;
  public readonly contributions;

  private processContributions(contributions: VisualizationTypeOptions['contributions']) {
    const uiContainers: ContainerLocationContribution = {
      sidePanel: [],
      toolbar: [],
    };
    const { containers, items } = contributions;

    // Validate and populate containers for each container location
    Object.keys(uiContainers).forEach((location) => {
      const typedLocation = location as ContainerLocations;
      const vizContainers = containers?.[typedLocation];

      const mergedContainers = mergeArrays(
        DEFAULT_CONTAINERS[typedLocation],
        vizContainers || [],
        'id'
      );
      uiContainers[typedLocation] = mergedContainers;
    });

    return {
      containers: uiContainers,
      items,
    };
  }

  constructor(options: VisualizationTypeOptions) {
    this.name = options.name;
    this.title = options.title;
    this.description = options.description ?? '';
    this.icon = options.icon;
    this.stage = options.stage ?? 'production';
    this.contributions = this.processContributions(options.contributions);
  }
}
