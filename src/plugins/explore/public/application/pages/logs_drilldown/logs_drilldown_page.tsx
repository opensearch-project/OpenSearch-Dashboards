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
  EuiToolTip,
  OnTimeChangeProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import useDebounce from 'react-use/lib/useDebounce';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { MountPointPortal } from '../../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../../../data/common';
import { syncQueryStateWithUrl } from '../../../../../data/public';
import { Storage } from '../../../../../opensearch_dashboards_utils/public';
import { ExploreServices } from '../../../types';
import { DataSourceControl } from './components/data_source_control';
import { RowsView, BatchAction } from './components/rows_view';
import { useIndexClassification } from './hooks/use_index_classification';

const SEARCH_DEBOUNCE_MS = 300;

// Per-tab remembered data source. The nav-popover / query-bar entry points open the drilldown at a
// bare `#/` (no `_a`), so the URL alone can't survive re-entry — this sessionStorage fallback keeps
// the last selection for the tab session. URL `_a` still wins when present (shareable/bookmarkable).
const DATA_SOURCE_STORAGE_KEY = 'logsDrilldown.dataSource';

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
  const urlStateStorage = services.osdUrlStateStorage;

  // Per-tab session store for the last selected data source (survives re-entry from a bare `#/`).
  const sessionStore = useMemo(() => new Storage(window.sessionStorage), []);

  // Restore the selected data source on first mount. The URL `_a` wins (bookmarkable/shareable);
  // when it's absent — as when the nav-popover / query-bar action opens the drilldown at a bare
  // `#/` — fall back to the per-tab session store so the last selection isn't lost on re-entry.
  const initialDataSource = useMemo<Dataset['dataSource'] | undefined>(() => {
    const fromUrl = urlStateStorage?.get<{ dataSource?: Dataset['dataSource'] }>('_a')?.dataSource;
    return fromUrl ?? sessionStore.get(DATA_SOURCE_STORAGE_KEY) ?? undefined;
    // Read once on mount; later changes are written out, not read back in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data source scoping the list (MDS). Local state, mirrored to the `_a` URL key.
  const [selectedDataSource, setSelectedDataSource] = useState<Dataset['dataSource']>(
    initialDataSource
  );
  const dataSource = selectedDataSource;
  const dataSourceId = dataSource?.id;

  // If the source was restored from the session store (the URL had no `_a`, e.g. re-entry from a
  // bare `#/`), seed it into the URL now so `_a` is authoritative immediately — shareable and
  // reload-safe without waiting for the picker to fire a change.
  useEffect(() => {
    if (initialDataSource && !urlStateStorage?.get('_a')) {
      urlStateStorage?.set('_a', { dataSource: initialDataSource }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default the time range to the last 15 minutes on mount UNLESS this drilldown's own URL already
  // pins a range (`_g.time`). The timefilter is a shared singleton, so without this the drilldown
  // would inherit whatever (possibly very wide) range the Logs Query page had — flooding the cluster
  // with heavy per-card queries on first load. A user-picked range persists to `_g` (via the sync
  // below), so it survives reloads and is respected here. Runs once, before the URL sync starts.
  useEffect(() => {
    const urlTime = urlStateStorage?.get<{ time?: unknown }>('_g')?.time;
    if (!urlTime) {
      timefilter.setTime({ from: 'now-15m', to: 'now' });
    }
    // Mount-only: we intentionally read the URL once and don't re-run on range changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync the global time range (`_g`) with the URL so it survives a hard reload and stays shareable
  // — the time range is already shared across apps via the singleton timefilter; this adds URL
  // persistence, matching the logs/traces/metrics flavors' `syncQueryStateWithUrl`.
  useEffect(() => {
    if (!urlStateStorage) return;
    const { stop } = syncQueryStateWithUrl(
      services.data.query,
      urlStateStorage,
      services.uiSettings
    );
    return stop;
  }, [services.data.query, services.uiSettings, urlStateStorage]);

  // Is MDS active on this instance? When it is, the local cluster is hidden from the picker (see
  // DataSourceControl), so the ONLY queryable target is an explicitly-resolved data source. When
  // MDS is off, the implicit local cluster is the queryable target. We mirror DataSourceControl's
  // own render gate so the two stay in sync.
  const mdsEnabled = !!services.dataSourceManagement?.ui?.DataSourceSelector;
  // Whether the selector has resolved to a concrete data source yet (only meaningful when MDS is on).
  // Seeded true when a data source was restored from the URL so the list shows immediately on reload.
  const [dataSourceResolved, setDataSourceResolved] = useState(!!initialDataSource?.id);
  // With MDS on we must NOT fall back to local-cluster indexes when no data source is selected — the
  // picker reports an empty selection and we show one of the two empty states below instead.
  const canQueryIndexes = !mdsEnabled || (dataSourceResolved && !!dataSourceId);

  // Does the (workspace-scoped) instance have ANY data source at all? Distinguishes the two empty
  // states: none exist (associate one) vs. some exist but none picked yet (select one). undefined =
  // not yet checked. Probed lazily ONLY while gated (no source resolved) — so when the picker
  // auto-selects a source we show the list and never make this call. It's a `perPage:1` existence
  // check, not a full list fetch. (The selector fetches the full list itself for its dropdown; we
  // can't observe that, so this is the minimal extra probe needed to pick the right copy.)
  const [hasAnyDataSource, setHasAnyDataSource] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (!mdsEnabled || canQueryIndexes || hasAnyDataSource !== undefined) return;
    let cancelled = false;
    services.savedObjects.client
      .find({ type: 'data-source', fields: ['id'], perPage: 1 })
      .then((res) => {
        if (!cancelled) setHasAnyDataSource((res?.total ?? 0) > 0);
      })
      .catch(() => {
        // On error, assume some may exist so we prompt to SELECT (never falsely claim none) — the
        // picker itself surfaces any fetch failure.
        if (!cancelled) setHasAnyDataSource(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mdsEnabled, canQueryIndexes, hasAnyDataSource, services.savedObjects.client]);

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

  const onDataSourceChange = useCallback(
    (ds: { id?: string; title?: string }) => {
      // An `id` means a concrete data source is selected. An empty id means the picker reported no
      // selection — with MDS on that's an empty workspace (no attached data sources), which must NOT
      // silently fall back to the local cluster (`dataSourceResolved` stays false → empty state).
      setDataSourceResolved(!!ds.id);
      const nextDataSource = ds.id
        ? ({ id: ds.id, title: ds.title ?? '', type: 'DATA_SOURCE' } as Dataset['dataSource'])
        : undefined;
      setSelectedDataSource(nextDataSource);
      // Persist to the `_a` URL key so the selection is restored on reload / shared via the URL.
      urlStateStorage?.set('_a', { dataSource: nextDataSource }, { replace: true });
      // Also remember it per-tab so re-entry from a bare `#/` (nav-popover / query-bar) restores it.
      if (nextDataSource) sessionStore.set(DATA_SOURCE_STORAGE_KEY, nextDataSource);
      else sessionStore.remove(DATA_SOURCE_STORAGE_KEY);
    },
    [urlStateStorage, sessionStore]
  );

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
          <DataSourceControl
            services={services}
            onChange={onDataSourceChange}
            defaultDataSourceId={initialDataSource?.id}
          />
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
          <EuiToolTip
            // Only explain the disabled state; when enabled the button label is self-explanatory.
            // EuiToolTip anchors on its wrapper span, so it still shows over the disabled button.
            content={
              batchAction
                ? undefined
                : i18n.translate('explore.logsDrilldown.rows.createDatasetDisabledTip', {
                    defaultMessage: 'Select one or more indexes to create a dataset',
                  })
            }
          >
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
          </EuiToolTip>
        </EuiFlexItem>
        {/* When there's no app header to portal into (embedded / tests), keep the picker inline. */}
        {!setHeaderActionMenu && (
          <EuiFlexItem grow={false} className="logsDrilldown__toolbarTime">
            {datePicker}
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    ),
    [
      services,
      onDataSourceChange,
      searchInput,
      batchAction,
      setHeaderActionMenu,
      datePicker,
      initialDataSource,
    ]
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
          onBatchActionChange={setBatchAction}
        />
      ) : hasAnyDataSource === false ? (
        // No data sources exist in this workspace at all → nothing to select; guide the user to
        // associate one. (We deliberately don't fall back to the local cluster.)
        <EuiEmptyPrompt
          iconType="database"
          data-test-subj="logsDrilldownNoDataSource"
          title={
            <h2>
              {i18n.translate('explore.logsDrilldown.noDataSource.title', {
                defaultMessage: 'No data sources available',
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
          actions={[
            <EuiButton
              key="associate"
              fill
              onClick={() => services.core.application.navigateToApp('dataSources')}
              data-test-subj="logsDrilldownAssociateDataSource"
            >
              {i18n.translate('explore.logsDrilldown.noDataSource.associate', {
                defaultMessage: 'Associate a data source',
              })}
            </EuiButton>,
          ]}
        />
      ) : (
        // Data sources exist but none is selected yet → prompt the user to pick one from the toolbar
        // picker. (hasAnyDataSource === true, or still undefined/loading — select is the safe copy.)
        <EuiEmptyPrompt
          iconType="database"
          data-test-subj="logsDrilldownSelectDataSource"
          title={
            <h2>
              {i18n.translate('explore.logsDrilldown.selectDataSource.title', {
                defaultMessage: 'Select a data source',
              })}
            </h2>
          }
          body={
            <p>
              {i18n.translate('explore.logsDrilldown.selectDataSource.body', {
                defaultMessage:
                  'Choose a data source from the picker above to explore its indexes and logs.',
              })}
            </p>
          }
        />
      )}
    </div>
  );
};
