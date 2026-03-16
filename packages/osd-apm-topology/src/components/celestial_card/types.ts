/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Metrics, SloHealth, ChangeEvents } from '../../shared/types/common.types';
import type { StatisticReferences, AttributeMaps } from '../../shared/types/sdk.types';

export interface CelestialCardProps {
  icon?: React.ReactNode;
  id: string;
  title: string;
  subtitle?: string;
  platform?: string;
  isGroup?: boolean;
  aggregatedNodeId?: string | null;
  type?: string;
  isInstrumented?: boolean;
  metrics?: Metrics;
  health?: SloHealth;
  latestChanges?: ChangeEvents;
  numberOfServices?: string;
  percentOfUninstrumentedServices?: string;
  keyAttributes: Record<string, string>;
  attributes?: AttributeMaps;
  applications?: AttributeMaps;
  statisticReferences?: StatisticReferences;
  isFaded?: boolean; // Add this property to control opacity
  /** Custom node border & glow color. Overridden by breach state. */
  color?: string;
  dependencyTypes?: string[];
  stackedNodeIds?: string[];
  isStacked?: boolean;
  isTopOfTheStack?: boolean;
  isCollapsable?: boolean;
  isCollapsed?: boolean;
  isDirectService?: boolean;
  /** Configurable type badge. `false` hides it (default). Provide an object to show it. */
  typeBadge?:
    | {
        label: string;
        color: string;
        icon?: React.ReactNode;
        textColor?: string;
      }
    | false;
}
