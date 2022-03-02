/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IconType } from '@elastic/eui';

export interface VisualizationTypeOptions {
  readonly name: string;
  readonly title: string;
  readonly description?: string;
  readonly icon: IconType;
  readonly stage?: 'beta' | 'production';
  readonly contributions: {
    containers?: {
      // Define new or override existing view containers
      name: string;
      title: string;
      location: 'panel' | 'toolbar';
      //   render: (schemas: ContainerSchema[]) => {}; // recieves an array of items to render within the container
    };
    items?: {
      'container-name': any[]; // schema that is used to render the container. Each container is responsible for deciding that for consistency
      //   'container-name': ContainerSchema[]; // schema that is used to render the container. Each container is responsible for deciding that for consistency
    };
  };
  //   pipeline: Expression;
}

export type IVisualizationType = Required<VisualizationTypeOptions>;

export class VisualizationType implements IVisualizationType {
  public readonly name;
  public readonly title;
  public readonly description;
  public readonly icon;
  public readonly stage;
  public readonly contributions;

  constructor(options: VisualizationTypeOptions) {
    this.name = options.name;
    this.title = options.title;
    this.description = options.description ?? '';
    this.icon = options.icon;
    this.stage = options.stage ?? 'production';
    this.contributions = options.contributions;
  }
}
