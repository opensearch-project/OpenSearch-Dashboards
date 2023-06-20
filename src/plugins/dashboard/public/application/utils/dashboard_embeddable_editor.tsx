/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useEffect } from 'react';

function DashboardEmbeddableEditor({
  timeRange,
  filters,
  query,
  dom,
  savedDashboardInstance,
  eventEmitter,
  dashboardContainer,
}: any) {
  useEffect(() => {
    if (!dom) {
      return;
    }

    dashboardContainer.render(dom);
    setTimeout(() => {
      eventEmitter.emit('embeddableRendered');
    });

    return () => dashboardContainer.destroy();
  }, [dashboardContainer, eventEmitter, dom]);

  useEffect(() => {
    dashboardContainer.updateInput({
      timeRange,
      filters,
      query,
    });
  }, [dashboardContainer, timeRange, filters, query]);

  return <div />;
}

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { DashboardEmbeddableEditor as default };
