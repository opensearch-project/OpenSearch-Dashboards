/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { useMemo } from 'react';
import {
  setAnchor,
  setPredecessors,
  setSuccessors,
  setContextFetchStatus,
  useDispatch,
} from '../../../utils/state_management';

import { Filter } from '../../../../../../../../src/plugins/data/public';
import { fetchAnchor } from '../api/anchor';
import { OpenSearchHitRecord, fetchSurroundingDocs } from '../api/context';
import { FAILURE_REASONS, LOADING_STATUS } from './constants';
// import { MarkdownSimple, toMountPoint } from '../../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../../build_services';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { CONTEXT_TIE_BREAKER_FIELDS_SETTING } from '../../../../../common';
import { getFirstSortableField, SortDirection } from '../api/utils/sorting';
import { useDiscoverContext } from '../../../view_components/context';
import { SurrDocType } from '../api/context';

export interface Props {
  anchorId: string;
}

export function useQueryActions() {
  const dispatch = useDispatch();
  const { indexPattern } = useDiscoverContext();
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { data, uiSettings, toastNotifications } = services;
  const searchSource = useMemo(() => {
    return data.search.searchSource.createEmpty();
  }, [data.search.searchSource]);
  const tieBreakerField = useMemo(
    () => getFirstSortableField(indexPattern, uiSettings.get(CONTEXT_TIE_BREAKER_FIELDS_SETTING)),
    [uiSettings, indexPattern]
  );

  const fetchAnchorRow = async (anchorId: string) => {
    if (!tieBreakerField) {
      setContextFetchStatus({
        anchorStatus: { value: LOADING_STATUS.FAILED, reason: FAILURE_REASONS.INVALID_TIEBREAKER },
      });
      return;
    }

    try {
      dispatch(setContextFetchStatus({ anchorStatus: { value: LOADING_STATUS.LOADING } }));
      const sort = [
        { [indexPattern.timeFieldName!]: SortDirection.desc },
        { [tieBreakerField]: SortDirection.desc },
      ];
      const fetchAnchorResult = await fetchAnchor(anchorId, indexPattern, searchSource, sort);
      dispatch(setAnchor(fetchAnchorResult));
      dispatch(setContextFetchStatus({ anchorStatus: { value: LOADING_STATUS.LOADED } }));
      return fetchAnchorResult;
    } catch (error) {
      setContextFetchStatus({
        anchorStatus: { value: LOADING_STATUS.FAILED, reason: FAILURE_REASONS.UNKNOWN },
      });
      toastNotifications.addDanger({
        title: i18n.translate('discover.context.unableToLoadAnchorDocumentDescription', {
          defaultMessage: 'Unable to fetch anchor document',
        }),
        text: 'fail',
      });
    }
  };

  const fetchSurroundingRows = async (
    type: SurrDocType,
    count: number,
    filters: Filter[],
    anchor: OpenSearchHitRecord
  ) => {
    try {
      if (type === SurrDocType.PREDECESSORS) {
        dispatch(setContextFetchStatus({ predecessorStatus: { value: LOADING_STATUS.LOADING } }));
      } else {
        dispatch(setContextFetchStatus({ successorStatus: { value: LOADING_STATUS.LOADING } }));
      }

      const rows = await fetchSurroundingDocs(
        type,
        indexPattern,
        anchor as OpenSearchHitRecord,
        tieBreakerField,
        SortDirection.desc,
        count,
        filters
      );
      if (type === SurrDocType.PREDECESSORS) {
        dispatch(setPredecessors(rows));
        dispatch(setContextFetchStatus({ predecessorStatus: { value: LOADING_STATUS.LOADED } }));
      } else {
        dispatch(setSuccessors(rows));
        dispatch(setContextFetchStatus({ successorStatus: { value: LOADING_STATUS.LOADED } }));
      }
    } catch (error) {
      if (type === SurrDocType.PREDECESSORS) {
        dispatch(
          setContextFetchStatus({
            predecessorStatus: { value: LOADING_STATUS.FAILED, reason: FAILURE_REASONS.UNKNOWN },
          })
        );
      } else {
        dispatch(
          setContextFetchStatus({
            successorStatus: { value: LOADING_STATUS.FAILED, reason: FAILURE_REASONS.UNKNOWN },
          })
        );
        toastNotifications.addDanger({
          title: i18n.translate('discover.context.unableToLoadDocumentDescription', {
            defaultMessage: 'Unable to fetch surrounding documents',
          }),
          text: 'fail',
        });
      }
    }
  };

  const fetchContextRows = async (
    predecessorCount: number,
    successorCount: number,
    filters: Filter[],
    anchor: OpenSearchHitRecord
  ) =>
    Promise.all([
      fetchSurroundingRows(SurrDocType.PREDECESSORS, predecessorCount, filters, anchor),
      fetchSurroundingRows(SurrDocType.SUCCESSORS, successorCount, filters, anchor),
    ]);

  const fetchAllRows = async (
    anchorId: string,
    predecessorCount: number,
    successorCount: number,
    filters: Filter[]
  ) => {
    try {
      const anchor = await fetchAnchorRow(anchorId);
      fetchContextRows(predecessorCount, successorCount, filters, anchor);
    } catch (error) {
      toastNotifications.addDanger({
        title: i18n.translate('discover.context.unableToLoadDocumentDescription', {
          defaultMessage: 'Unable to fetch all documents',
        }),
        text: 'fail',
      });
    }
  };

  return {
    fetchAnchorRow,
    fetchAllRows,
    fetchContextRows,
    fetchSurroundingRows,
  };
}
