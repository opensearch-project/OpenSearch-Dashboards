/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { EuiErrorBoundary } from '@elastic/eui';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { QueryResultExtensionConfig, QueryResultExtensionDependencies } from '../../../../../../data/public/query/query_string/query_results_service';

export interface QueryResultExtensionProps {
  config: QueryResultExtensionConfig;
  dependencies: QueryResultExtensionDependencies;
  bannerContainer: Element;
}

const QueryResultExtensionPortal: React.FC<{ container: Element }> = (props) => {
  if (!props.children) return null;

  return ReactDOM.createPortal(
    <EuiErrorBoundary>{props.children}</EuiErrorBoundary>,
    props.container
  );
};

export const QueryResultExtension = ({
  config,
  dependencies,
  bannerContainer
}: QueryResultExtensionProps) => {
  const banner = useMemo(() => config.getBanner?.(dependencies), [
    config,
    dependencies,
  ]);

  return (
    <QueryResultExtensionPortal
      container={bannerContainer}
    >
      {banner}
    </QueryResultExtensionPortal>
  )
}