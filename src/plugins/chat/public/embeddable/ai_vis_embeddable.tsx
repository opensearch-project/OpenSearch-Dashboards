/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Embeddable, EmbeddableInput, IContainer } from '../../../embeddable/public';
import { AiVisInput, AiVisOutput } from './types';
import { ExploreVisualization } from '../components/explore_visualization/explore_visualization';
import { AI_VIS_EMBEDDABLE_TYPE } from './ai_vis_embeddable_factory';

interface AiVisEmbeddableConfig {
  savedObjectId?: string;
  title?: string;
  visualizationData?: any;
}

export class AiVisEmbeddable extends Embeddable<AiVisInput, AiVisOutput> {
  public readonly type = AI_VIS_EMBEDDABLE_TYPE;
  private title: string;
  private visualizationData: any;

  constructor(
    config: AiVisEmbeddableConfig,
    initialInput: Partial<AiVisInput> & EmbeddableInput,
    private readonly executeTriggerActions: any,
    parent?: IContainer
  ) {
    super(
      {
        ...initialInput,
        title: config.title || 'AI Visualization',
        savedObjectId: config.savedObjectId,
        visualizationData: config.visualizationData,
      },
      {
        savedObjectId: config.savedObjectId,
        editUrl: `/app/chat`,
        indexPatterns: [],
      },
      parent
    );

    this.title = config.title || 'AI Visualization';
    this.visualizationData = config.visualizationData;
  }

  public reload() {
    this.updateOutput({
      loading: false,
      error: undefined,
    });
  }

  public render(container: HTMLElement) {
    // Use React to render the visualization
    const mountPoint = document.createElement('div');
    mountPoint.style.width = '100%';
    mountPoint.style.height = '100%';
    container.appendChild(mountPoint);

    // Use ReactDOM to render the component
    ReactDOM.render(
      <div style={{ width: '100%', height: '100%' }}>
        <ExploreVisualization
          data={this.visualizationData}
          height={container.clientHeight}
          showExpandButton={false}
        />
      </div>,
      mountPoint
    );

    return () => {
      ReactDOM.unmountComponentAtNode(mountPoint);
      container.removeChild(mountPoint);
    };
  }
}
