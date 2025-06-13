/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SearchProps } from './explore_embeddable';
import { VisualizationNoResults } from '../../../visualizations/public';
import { getServices } from '../application/legacy/discover/opensearch_dashboards_services';

interface ExploreEmbeddableProps {
  searchProps: SearchProps;
}

export const ExploreEmbeddableComponent = ({ searchProps }: ExploreEmbeddableProps) => {
  const services = getServices();
  const {
    expressions: { ReactExpressionRenderer },
  } = services;

  return (
    <EuiFlexGroup
      gutterSize="xs"
      direction="column"
      responsive={false}
      data-test-subj="embeddedSavedExplore"
      className="eui-xScrollWithShadows eui-yScrollWithShadows"
    >
      <EuiFlexItem style={{ minHeight: 0 }} data-test-subj="osdExploreContainer">
        {
          searchProps?.rows?.length === 0 ? (
            <EuiFlexItem>
              <VisualizationNoResults />
            </EuiFlexItem>
          ) : (
            <ReactExpressionRenderer
              expression={searchProps.expression ?? ''}
              searchContext={searchProps.searchContext}
              key={JSON.stringify(searchProps.searchContext) + searchProps.expression}
            />
          )
          // TODO: Support table render if visualization is not matched
        }
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
