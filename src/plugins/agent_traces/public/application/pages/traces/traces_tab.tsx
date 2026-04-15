/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TracesDataTable } from './traces_data_table';

export const TracesTab = () => {
  return (
    <div className="agentTraces-traces-tab tab-container">
      <TracesDataTable />
    </div>
  );
};
