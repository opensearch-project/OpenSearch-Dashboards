/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { GlobeIcon } from '../../shared/resources';
import { DEFAULT_METRICS } from '../../shared/constants/common.constants';
import { Breadcrumb } from './breadcrumb';
import type { BreadcrumbTrailProps } from './types';
import { HealthDonut } from '../health_donut';

/**
 * BreadcrumbTrail component displays a navigation breadcrumb path
 *
 * @param {Object} props - Component props
 * @param {Array} props.breadcrumbs - Array of breadcrumb items with id and title
 * @param {Function} props.onBreadcrumbClick - Click handler for breadcrumb items
 * @returns {JSX.Element} Rendered breadcrumb trail
 */
export const BreadcrumbTrail = ({
  breadcrumbs,
  onBreadcrumbClick,
  hotspot,
}: BreadcrumbTrailProps) => (
  <div className="osd:flex osd:items-center osd:px-4 osd:py-3">
    {breadcrumbs.map((breadcrumb, index) => (
      <Breadcrumb
        key={breadcrumb.node?.id || breadcrumb.title}
        title={breadcrumb.title}
        onBreadcrumbClick={
          index < breadcrumbs.length - 1 ? () => onBreadcrumbClick(breadcrumb, index) : undefined
        }
      >
        {index === 0 ? (
          <img src={GlobeIcon} className="celIcon osd:w-5 osd:h-5 osd:text-body-secondary" alt="" />
        ) : (
          <HealthDonut
            metrics={breadcrumb.node?.metrics || { ...DEFAULT_METRICS }}
            size={30}
            icon={breadcrumb.node?.icon}
            health={breadcrumb.node?.health}
          />
        )}
      </Breadcrumb>
    ))}
    {hotspot}
  </div>
);
