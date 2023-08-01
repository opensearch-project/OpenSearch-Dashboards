/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TopNav } from './top_nav';
import { ViewProps } from '../../../../../data_explorer/public';
import { DiscoverTable } from './discover_table';

// eslint-disable-next-line import/no-default-export
export default function DiscoverCanvas({ setHeaderActionMenu, history }: ViewProps) {
  return (
    <div>
      <TopNav
        opts={{
          setHeaderActionMenu,
        }}
      />
      <DiscoverTable history={history} />
    </div>
  );
}
