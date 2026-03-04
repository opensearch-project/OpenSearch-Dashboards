/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Import dependencies
 */
import { t } from '../i18n/t';
import type { TopologyNodeModel } from '../models/topology_node.model';
import { titleCaseToSentenceCase } from '../utils/case.utils';

/**
 * TopologyNodePresenter
 *
 * A presenter class that formats topology node data for display.
 * Follows the presenter pattern to separate formatting logic from model logic.
 * Handles internationalization, formatting, and display-specific transformations.
 */
export class TopologyNodePresenter {
  /** The topology node model being presented */
  readonly model: TopologyNodeModel;

  /**
   * Creates a new TopologyNodePresenter instance
   *
   * @param model - The topology node model to present
   */
  constructor(model: TopologyNodeModel) {
    this.model = model;
  }

  public get title(): string {
    return this.model.name;
  }

  public get subtitle(): string {
    if (this.model.isGroup && this.groupType) {
      return this.groupType;
    }

    if (this.model.platform) {
      return t('node.service');
    }

    return this.type;
  }

  /**
   * Gets a display-friendly version of the platform name
   * Splits platform strings on '::' and converts from title case to sentence case
   * Preserves specific terms like 'CloudWatch' from being converted
   *
   * @returns A formatted string representing the platform name
   */
  public get platform(): string {
    return this.model.platform
      ?.split('::')
      .map((word) => titleCaseToSentenceCase(word, ['CloudWatch']))
      .join(' ');
  }

  /**
   * Formats the node type for display
   * Splits type strings on '::' and converts from title case to sentence case
   * Preserves specific terms like 'CloudWatch' from being converted
   *
   * @returns A formatted string representing the node type
   */
  public get type(): string {
    return this.model.type
      .split('::')
      .map((word) => titleCaseToSentenceCase(word, ['CloudWatch']))
      .join(' ');
  }

  /**
   * Gets a localized string indicating the number of services
   *
   * @returns A formatted and translated string showing the service count
   */
  public get numberOfServices(): string {
    return `${this.model.numberOfServices}`;
  }

  /**
   * Gets a localized string indicating the number of uninstrumented services
   *
   * @returns A formatted and translated string showing the uninstrumented service count
   */
  public get percentOfUninstrumentedServices(): string {
    if (this.model.numberOfUninstrumentedServices === 0) {
      return t(`node.percentOfUninstrumentedServices`, { value: 0 });
    }

    return t(`node.percentOfUninstrumentedServices`, {
      value: Math.round(
        (this.model.numberOfUninstrumentedServices / this.model.numberOfServices) * 100
      ).toFixed(1),
    });
  }

  /**
   * Gets a display-friendly version of the group type
   * Applies special case handling for specific group types:
   * - 'Related' is displayed as 'Application'
   * - Other types are converted from title case to sentence case
   *
   * @returns A formatted string representing the group type, or undefined if no group type
   */
  public get groupType(): string | undefined {
    const type = this.model.groupType;
    if (!type) return undefined;

    if (type === 'Related') {
      return 'Application';
    }

    return titleCaseToSentenceCase(this.model.groupType);
  }
}
