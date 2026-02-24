/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopologyNodeModel } from '../models/topology-node.model';
import { getIcon } from '../utils/icons.utils';
import { TopologyNodePresenter } from '../presenters/topology-node.presenter';
import { DEFAULT_METRICS } from '../constants/common.constants';
import type { CelestialCardProps } from '../../components/CelestialCard/types';

export class TopologyNodeTransformer {
  readonly model: TopologyNodeModel;

  readonly presenter: TopologyNodePresenter;

  constructor(model: TopologyNodeModel) {
    this.model = model;
    this.presenter = new TopologyNodePresenter(model);
  }

  toCelestialCard(): CelestialCardProps {
    return {
      id: this.model.id,
      icon: getIcon(this.model.type),
      title: this.model.name,
      subtitle: this.presenter.subtitle,
      isGroup: this.model.isGroup,
      aggregatedNodeId: this.model.aggregatedNodeId,
      platform: this.presenter.platform,
      type: this.presenter.type,
      isInstrumented: this.model.isInstrumented,
      numberOfServices: this.presenter.numberOfServices,
      percentOfUninstrumentedServices: this.presenter.percentOfUninstrumentedServices,
      keyAttributes: this.model.node.KeyAttributes,
      statisticReferences: this.model.node.StatisticReferences,
      attributes: this.model.node.AttributeMaps,
      applications: this.model.node.Applications,
      isDirectService: this.model.isDirectService,
      metrics: {
        ...DEFAULT_METRICS,
      },
      dependencyTypes: this.model.node.DependencyTypes,
    };
  }
}
