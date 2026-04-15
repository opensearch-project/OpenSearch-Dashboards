/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpansDataTable } from './spans_data_table';

export const SpansTab = () => {
  return (
    <div className="agentTraces-spans-tab tab-container">
      <SpansDataTable />
    </div>
  );
};
