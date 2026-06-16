/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CelestialCardProps } from '../celestial_card/types';

export interface Breadcrumb {
  title: string;
  node?: CelestialCardProps;
}
export interface BreadcrumbTrailProps {
  breadcrumbs: Breadcrumb[];
  onBreadcrumbClick: (Breadcrumb: Breadcrumb, index: number) => void;
  hotspot?: React.ReactNode;
  /** Custom icon (URL or data-URI) for the root breadcrumb. Defaults to globe icon. */
  rootIcon?: string;
}
