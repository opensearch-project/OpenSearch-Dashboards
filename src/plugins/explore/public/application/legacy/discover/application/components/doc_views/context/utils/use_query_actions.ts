/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useMemo, useCallback, useState } from 'react';

import { Filter } from '../../../../../../../data/public';
import { fetchAnchor } from '../api/anchor';
import { OpenSearchHitRecord, fetchSurroundingDocs } from '../api/context';
import { DiscoverServices } from '../../../../../build_services';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { CONTEXT_TIE_BREAKER_FIELDS_SETTING } from '../../../../../../common';
import { getFirstSortableField, SortDirection } from '../api/utils/sorting';
import { SurrDocType } from '../api/context';
import { IndexPattern } from '../../../../../opensearch_dashboards_services';
import { ContextQueryState, FAILURE_REASONS, LOADING_STATUS } from './context_query_state';

const initialState: ContextQueryState = {
  anchor: {} as OpenSearchHitRecord,
  predecessors: [],
  successors: [],
  anchorStatus: { value: LOADING_STATUS.UNINITIALIZED },
  predecessorsStatus: { value: LOADING_STATUS.UNINITIALIZED },
  successorsStatus: { value: LOADING_STATUS.UNINITIALIZED },
};

export function useQueryActions(anchorId: string, indexPattern: IndexPattern) {
  const { services } = useOpenSearchDashboards<DiscoverServices>();
  const { data, uiSettings, toastNotifications } = services;
  const searchSource = useMemo(() => {
    return data.search.searchSource.createEmpty();
  }, [data.search.searchSource]);
  const tieBreakerField = useMemo(
    () => getFirstSortableField(indexPattern, uiSettings.get(CONTEXT_TIE_BREAKER_FIELDS_SETTING)),
    [uiSettings, indexPattern]
  );
  const [contextQueryState, setContextQueryState] = useState<ContextQueryState>(initialState);

  const fetchAnchorRow = useCallback(async () => {
    if (!tieBreakerField) {
      setContextQueryState((prevState) => ({
        ...prevState,
        anchorStatus: {
          value: LOADING_STATUS.FAILED,
          reason: FAILURE_REASONS.INVALID_TIEBREAKER,
        },
      }));
      return;
    }

    try {
      setContextQueryState((prevState) => ({
        ...prevState,
        anchorStatus: { value: LOADING_STATUS.LOADING },
      }));
      const sort = [
        { [indexPattern.timeFieldName!]: SortDirection.desc },
        { [tieBreakerField]: SortDirection.desc },
      ];
      const fetchAnchorResult = await fetchAnchor(anchorId, indexPattern, searchSource, sort);
      setContextQueryState((prevState) => ({
        ...prevState,
        anchor: fetchAnchorResult,
        anchorStatus: { value: LOADING_STATUS.LOADED },
      }));
      return fetchAnchorResult;
    } catch (error) {
      setContextQueryState((prevState) => ({
        ...prevState,
        anchorStatus: { value: LOADING_STATUS.FAILED, reason: FAILURE_REASONS.UNKNOWN },
      }));
      toastNotifications.addDanger({
        title: i18n.translate('discover.context.unableToLoadAnchorDocumentDescription', {
          defaultMessage: 'Unable to fetch anchor document',
        }),
        text: 'fail',
      });
    }
  }, [anchorId, indexPattern, searchSource, tieBreakerField, toastNotifications]);

  const fetchSurroundingRows = useCallback(
    async (type: SurrDocType, count: number, filters: Filter[], anchor?: OpenSearchHitRecord) => {
      try {
        if (type === SurrDocType.PREDECESSORS) {
          setContextQueryState((prevState) => ({
            ...prevState,
            predecessorsStatus: { value: LOADING_STATUS.LOADING },
          }));
        } else {
          setContextQueryState((prevState) => ({
            ...prevState,
            successorsStatus: { value: LOADING_STATUS.LOADING },
          }));
        }
        const fetchedAchor = anchor || contextQueryState.anchor;

        const rows = await fetchSurroundingDocs(
          type,
          indexPattern,
          fetchedAchor as OpenSearchHitRecord,
          tieBreakerField,
          SortDirection.desc,
          count,
          filters
        );
        if (type === SurrDocType.PREDECESSORS) {
          setContextQueryState((prevState) => ({
            ...prevState,
            predecessors: rows,
            predecessorsStatus: { value: LOADING_STATUS.LOADED },
          }));
        } else {
          setContextQueryState((prevState) => ({
            ...prevState,
            successors: rows,
            successorsStatus: { value: LOADING_STATUS.LOADED },
          }));
        }
      } catch (error) {
        if (type === SurrDocType.PREDECESSORS) {
          setContextQueryState((prevState) => ({
            ...prevState,
            predecessorsStatus: { value: LOADING_STATUS.FAILED, reason: FAILURE_REASONS.UNKNOWN },
          }));
        } else {
          setContextQueryState((prevState) => ({
            ...prevState,
            successorsStatus: { value: LOADING_STATUS.FAILED, reason: FAILURE_REASONS.UNKNOWN },
          }));
        }
        toastNotifications.addDanger({
          title: i18n.translate('discover.context.unableToLoadSurroundingDocumentDescription', {
            defaultMessage: 'Unable to fetch surrounding documents',
          }),
          text: 'fail',
        });
      }
    },
    [contextQueryState.anchor, indexPattern, tieBreakerField, toastNotifications]
  );

  const fetchContextRows = useCallback(
    async (
      predecessorCount: number,
      successorCount: number,
      filters: Filter[],
      anchor?: OpenSearchHitRecord
    ) =>
      Promise.all([
        fetchSurroundingRows(SurrDocType.PREDECESSORS, predecessorCount, filters, anchor),
        fetchSurroundingRows(SurrDocType.SUCCESSORS, successorCount, filters, anchor),
      ]),
    [fetchSurroundingRows]
  );

  const fetchAllRows = useCallback(
    async (predecessorCount: number, successorCount: number, filters: Filter[]) => {
      try {
        await fetchAnchorRow().then(
          (anchor) => anchor && fetchContextRows(predecessorCount, successorCount, filters, anchor)
        );
      } catch (error) {
        toastNotifications.addDanger({
          title: i18n.translate('discover.context.unableToLoadDocumentDescription', {
            defaultMessage: 'Unable to fetch all documents',
          }),
          text: 'fail',
        });
      }
    },
    [fetchAnchorRow, fetchContextRows, toastNotifications]
  );

  const resetContextQueryState = useCallback(() => {
    setContextQueryState(initialState);
  }, []);

  return {
    contextQueryState,
    fetchAnchorRow,
    fetchAllRows,
    fetchContextRows,
    fetchSurroundingRows,
    resetContextQueryState,
  };
}
