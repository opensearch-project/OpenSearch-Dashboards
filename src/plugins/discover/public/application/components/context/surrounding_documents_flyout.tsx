/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useMemo, useRef } from 'react';

import { EuiFlyout, EuiFlyoutHeader, EuiFlyoutBody, EuiTitle, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ContextApp } from './context_app';
import { IndexPatternField, opensearchFilters } from '../../../../../data/public';
import { useDiscoverContext } from '../../view_components/context';
import { useDispatch, useSelector } from '../../utils/state_management';
import { isEqualFilters } from '../../utils/filters';
import { useQueryActions } from './query/use_query_actions';
import { SurrDocType } from './api/context';
import {
  setAnchorId,
  setContextFilters,
} from '../../utils/state_management/discover_context_slice';

interface Props {
  hit: OpenSearchSearchHit;
  setDetailFlyoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSurroundingFlyoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setExpandedHit: (hit?: OpenSearchSearchHit) => void;
}

export function SurroundingDocumentsFlyout({
  hit,
  setDetailFlyoutOpen,
  setSurroundingFlyoutOpen,
  setExpandedHit,
}: Props) {
  const { indexPattern } = useDiscoverContext();
  const {
    services: {
      navigation: {
        ui: { TopNavMenu },
      },
      data: {
        query: { filterManager },
      },
    },
  } = useOpenSearchDashboards<DiscoverViewServices>();
  const dispatch = useDispatch();
  const {
    anchor,
    anchorId,
    filters,
    predecessorCount,
    successorCount,
    predecessors,
    successors,
  } = useSelector((state) => state.discoverContext);

  const previousContextState = useRef({
    anchor,
    anchorId,
    filters,
    predecessorCount,
    successorCount,
  });

  const onClose = () => {
    setSurroundingFlyoutOpen(false);
    setExpandedHit(undefined);
    setDetailFlyoutOpen(false);
  };
  const onAddFilter = useCallback(
    (field: IndexPatternField, values: string, operation: '+' | '-') => {
      const newFilters = opensearchFilters.generateFilters(
        filterManager,
        field,
        values,
        operation,
        indexPattern.id
      );
      return filterManager.addFilters(newFilters);
    },
    [filterManager, indexPattern]
  );

  const { fetchContextRows, fetchAllRows, fetchSurroundingRows } = useQueryActions();

  if (anchorId !== hit._id) dispatch(setAnchorId(hit._id));
  if (!isEqualFilters(filters, filterManager.getFilters()))
    dispatch(setContextFilters(filterManager.getFilters()));

  useEffect(() => {
    if (previousContextState.current.predecessorCount !== predecessorCount) {
      fetchSurroundingRows(SurrDocType.PREDECESSORS, predecessorCount, filters, anchor);
    } else if (previousContextState.current.successorCount !== successorCount) {
      fetchSurroundingRows(SurrDocType.SUCCESSORS, successorCount, filters, anchor);
    } else if (
      previousContextState.current.anchorId !== anchorId ||
      Object.keys(previousContextState.current.anchor).length === 0
    ) {
      fetchAllRows(anchorId, predecessorCount, successorCount, filters);
    } else if (!isEqualFilters(previousContextState.current.filters, filters)) {
      fetchContextRows(predecessorCount, successorCount, filters, anchor);
    }
    previousContextState.current = {
      anchor,
      anchorId,
      filters,
      predecessorCount,
      successorCount,
    };
  }, [
    anchor,
    anchorId,
    predecessorCount,
    successorCount,
    filters,
    fetchAllRows,
    fetchContextRows,
    fetchSurroundingRows,
  ]);

  const rows = useMemo(
    () => [...(predecessors || []), ...(anchor ? [anchor] : []), ...(successors || [])],
    [predecessors, anchor, successors]
  );
  return (
    <EuiFlyout onClose={onClose} size="m">
      <EuiFlyoutHeader>
        <EuiTitle>
          <EuiText>
            <strong>
              <FormattedMessage
                id="discover.context.docId"
                defaultMessage="Context of #{anchorId}"
                values={{ anchorId }}
              />
            </strong>
          </EuiText>
        </EuiTitle>
        <TopNavMenu
          appName={'discoverContext'}
          showSearchBar={true}
          showQueryBar={false}
          showDatePicker={false}
          indexPatterns={[indexPattern]}
          useDefaultBehaviors={true}
        />
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <ContextApp onAddFilter={onAddFilter} rows={rows} />
      </EuiFlyoutBody>
    </EuiFlyout>
  );
}
