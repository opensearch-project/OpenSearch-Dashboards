/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';

/**
 * Custom link renderer for markdown links to open in new tab
 */
export interface LinkRendererProps {
  href?: string;
  children: React.ReactNode;
}

export const LinkRenderer: React.FC<LinkRendererProps> = ({ href, children }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};
