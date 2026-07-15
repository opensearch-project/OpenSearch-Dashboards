/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldSearch,
  EuiSuperDatePicker,
  EuiSpacer,
  OnTimeChangeProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import useDebounce from 'react-use/lib/useDebounce';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { MountPointPortal } from '../../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../../../data/common';
import { ExploreServices } from '../../../types';
import { DataSourceControl } from './components/data_source_control';
import { RowsView, BatchAction } from './components/rows_view';
import { useIndexClassification } from './hooks/use_index_classification';

const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  services: ExploreServices;
} & Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>;

/**
 * LogsDrilldownPage — the standalone onboarding canvas (Grafana-style logs drilldown).
 *
 * Rows-only: a full-width vertical stack of per-item cards (histogram + raw log lines), teaching the
 * `data source → index → dataset` hierarchy and turning raw indexes into a durable dataset. Fully
 * self-contained: no explore Redux store; the data source is local React state, the global time
 * range drives the previews, and activating/creating a dataset hands off to the logs Query app.
 */
export const LogsDrilldownPage: React.FC<Props> = ({ services, setHeaderActionMenu }) => {
  const timefilter = services.data.query.timefilter.timefilter;

  // Data source scoping the list (MDS). Local state — no Redux.
  const [selectedDataSource, setSelectedDataSource] = useState<Dataset['dataSource']>(undefined);
  const dataSource = selectedDataSource;
  const dataSourceId = dataSource?.id;

  // Is MDS active on this instance? When it is, the local cluster is hidden from the picker (see
  // DataSourceControl), so the ONLY queryable target is an explicitly-resolved data source. When
  // MDS is off, the implicit local cluster is the queryable target. We mirror DataSourceControl's
  // own render gate so the two stay in sync.
  const mdsEnabled = !!services.dataSourceManagement?.ui?.DataSourceSelector;
  // Whether the selector has resolved to a concrete data source yet (only meaningful when MDS is on).
  const [dataSourceResolved, setDataSourceResolved] = useState(false);
  // With MDS on we must NOT fall back to local-cluster indexes when the workspace has no attached
  // data sources — the picker reports an empty selection and we show an empty state instead.
  const canQueryIndexes = !mdsEnabled || (dataSourceResolved && !!dataSourceId);

  // Shared, debounced search across datasets + indexes.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useDebounce(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS, [searchInput]);

  // The batch (multi-select) action RowsView reports up — drives the toolbar button.
  const [batchAction, setBatchAction] = useState<BatchAction | null>(null);

  // Page breadcrumb. This standalone app has no explore tab chrome, so it sets its own.
  useEffect(() => {
    services.chrome.setBreadcrumbs([
      {
        text: i18n.translate('explore.logsDrilldown.breadcrumb', {
          defaultMessage: 'Logs drilldown',
        }),
      },
    ]);
  }, [services.chrome]);

  // Global time range mirror, so the date picker reflects + drives the shared timefilter.
  const [time, setTime] = useState(() => timefilter.getTime());
  useEffect(() => {
    const sub = timefilter.getTimeUpdate$().subscribe(() => setTime(timefilter.getTime()));
    return () => sub.unsubscribe();
  }, [timefilter]);

  // Manual refresh: a monotonically-increasing nonce folded into refreshKey, so pressing the update
  // button re-runs the scheduler even when the time range string hasn't changed.
  const [refreshNonce, setRefreshNonce] = useState(0);
  const onRefresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

  // refreshKey changes when the range OR the manual-refresh nonce changes → RowsView re-fetches.
  const refreshKey = `${time.from}|${time.to}|${refreshNonce}`;

  // Resolve the picked range to epoch-ms bounds for the "No events in the last {range}" copy.
  // Depends on time.from/time.to intentionally — getBounds() reflects the range but isn't itself a dep.
  const { rangeFrom, rangeTo } = useMemo(() => {
    const bounds = timefilter.getBounds();
    return {
      rangeFrom: bounds?.min?.valueOf() ?? Date.now() - 15 * 60 * 1000,
      rangeTo: bounds?.max?.valueOf() ?? Date.now(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timefilter, time.from, time.to]);

  const onTimeChange = useCallback(
    ({ start, end }: OnTimeChangeProps) => {
      timefilter.setTime({ from: start, to: end });
    },
    [timefilter]
  );

  // Brush-select on a card histogram → set the global time range to the selected [from,to] (ISO).
  const onBrushTime = useCallback(
    (from: number, to: number) => {
      timefilter.setTime({ from: new Date(from).toISOString(), to: new Date(to).toISOString() });
    },
    [timefilter]
  );

  const onDataSourceChange = useCallback((ds: { id?: string; title?: string }) => {
    // An `id` means a concrete data source is selected. An empty id means the picker reported no
    // selection — with MDS on that's an empty workspace (no attached data sources), which must NOT
    // silently fall back to the local cluster (`dataSourceResolved` stays false → empty state).
    setDataSourceResolved(!!ds.id);
    setSelectedDataSource(
      ds.id
        ? ({ id: ds.id, title: ds.title ?? '', type: 'DATA_SOURCE' } as Dataset['dataSource'])
        : undefined
    );
  }, []);

  const { classify, getCached } = useIndexClassification(services, dataSourceId);

  const datePicker = useMemo(
    () => (
      <EuiSuperDatePicker
        compressed
        start={time.from}
        end={time.to}
        onTimeChange={onTimeChange}
        onRefresh={onRefresh}
        showUpdateButton
      />
    ),
    [time.from, time.to, onTimeChange, onRefresh]
  );

  const toolbar = useMemo(
    () => (
      <EuiFlexGroup
        gutterSize="s"
        alignItems="center"
        responsive={false}
        className="logsDrilldown__toolbar"
      >
        <EuiFlexItem grow={false} className="logsDrilldown__toolbarDs">
          <DataSourceControl services={services} onChange={onDataSourceChange} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFieldSearch
            compressed
            fullWidth
            isClearable
            placeholder={i18n.translate('explore.logsDrilldown.searchPlaceholder', {
              defaultMessage: 'Search datasets and indexes…',
            })}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={i18n.translate('explore.logsDrilldown.searchAriaLabel', {
              defaultMessage: 'Search datasets and indexes',
            })}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            fill
            isDisabled={!batchAction}
            onClick={() => batchAction?.onClick()}
            data-test-subj="logsExploreToolbarBatch"
          >
            {batchAction?.label ??
              i18n.translate('explore.logsDrilldown.rows.createDataset', {
                defaultMessage: 'Create dataset',
              })}
          </EuiButton>
        </EuiFlexItem>
        {/* When there's no app header to portal into (embedded / tests), keep the picker inline. */}
        {!setHeaderActionMenu && (
          <EuiFlexItem grow={false} className="logsDrilldown__toolbarTime">
            {datePicker}
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    ),
    [services, onDataSourceChange, searchInput, batchAction, setHeaderActionMenu, datePicker]
  );

  return (
    <div className="logsDrilldown" data-test-subj="logsDrilldownPage">
      {/* Portal the date picker + refresh into the app header, like the Logs Query experience. */}
      {setHeaderActionMenu && (
        <MountPointPortal setMountPoint={setHeaderActionMenu}>{datePicker}</MountPointPortal>
      )}
      {toolbar}
      <EuiSpacer size="s" />
      {canQueryIndexes ? (
        <RowsView
          services={services}
          dataSourceId={dataSourceId}
          dataSource={dataSource}
          search={search}
          refreshKey={refreshKey}
          classify={classify}
          getCached={getCached}
          onBrushTime={onBrushTime}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          onBatchActionChange={setBatchAction}
        />
      ) : (
        // MDS is on but no data source is attached to this workspace → we deliberately don't fall
        // back to the local cluster; guide the user to connect one instead.
        <EuiEmptyPrompt
          iconType="database"
          data-test-subj="logsDrilldownNoDataSource"
          title={
            <h2>
              {i18n.translate('explore.logsDrilldown.noDataSource.title', {
                defaultMessage: 'No data source connected',
              })}
            </h2>
          }
          body={
            <p>
              {i18n.translate('explore.logsDrilldown.noDataSource.body', {
                defaultMessage:
                  'This workspace has no data sources associated with it. Associate a data source to explore its indexes and logs.',
              })}
            </p>
          }
        />
      )}
    </div>
  );
};
