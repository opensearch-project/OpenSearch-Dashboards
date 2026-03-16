/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { PropsWithChildren } from 'react';
import { DividerIcon } from '../../shared/resources';

export interface BreadcrumbProps {
  title: string;
  onBreadcrumbClick?: (event: React.MouseEvent) => void;
}

export const Breadcrumb = ({
  title,
  onBreadcrumbClick,
  children,
}: PropsWithChildren<BreadcrumbProps>) => (
  <span className="osd:flex osd:items-center">
    {children}
    {!onBreadcrumbClick ? (
      <span className="osd:text-body-secondary osd:px-2 osd:py-1">{title}</span>
    ) : (
      <button
        onClick={onBreadcrumbClick}
        className="osd-resetFocusState osd:text-link-default osd:hover:text-link-hover osd:transition-colors osd:duration-200 osd:focus:outline-none osd:rounded osd:px-2 osd:py-1 osd:cursor-pointer"
      >
        {title}
      </button>
    )}
    {onBreadcrumbClick && (
      <span className="osd:text-body-secondary osd:mx-2">
        <img src={DividerIcon} className="celIcon osd:w-4 osd:h-4" alt="" />
      </span>
    )}
  </span>
);
