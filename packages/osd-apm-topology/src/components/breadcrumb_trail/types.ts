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
}
