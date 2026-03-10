/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { SpansTable } from './spans_table';

export const SpansTab = () => {
  return (
    <div className="agentTraces-spans-tab tab-container">
      <SpansTable />
    </div>
  );
};
