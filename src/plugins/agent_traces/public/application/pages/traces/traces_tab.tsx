/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { TracesTable } from './traces_table';

export const TracesTab = () => {
  return (
    <div className="agentTraces-traces-tab tab-container">
      <TracesTable />
    </div>
  );
};
