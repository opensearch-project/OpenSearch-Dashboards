/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ExploreFlavor } from '../../../../common';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
  SourceTypeDefinition,
  SourceTypeLogsDrilldown,
  SourceTypeLogsDrilldownScope,
} from '../../../services/source_type_registry';
import { ExploreServices } from '../../../types';
import { DataSourceControl } from './components/data_source_control';
import { RowsView } from './components/rows_view';
import { SourceBatchAction, SourceRowsView } from './components/source_rows_view';
import { SourceTypeControl } from './components/source_type_control';
import { useIndexClassification } from './hooks/use_index_classification';
import { resetPermissionToast } from './permission_toast';

const SEARCH_DEBOUNCE_MS = 300;

// Per-tab remembered data source. The nav-popover / query-bar entry points open the drilldown at a
// bare `#/` (no `_a`), so the URL alone can't survive re-entry — this sessionStorage fallback keeps
// the last selection for the tab session. URL `_a` still wins when present (shareable/bookmarkable).
const DATA_SOURCE_STORAGE_KEY = 'logsDrilldown.dataSource';
// The same per-tab fallback for the source type and a registered source's scope.
const SOURCE_TYPE_STORAGE_KEY = 'logsDrilldown.sourceType';
const SOURCE_SCOPE_STORAGE_KEY = 'logsDrilldown.sourceScope';

/** The page's `_a` URL state. */
interface DrilldownAppState {
  dataSource?: Dataset['dataSource'];
  /** The source type id; absent means OpenSearch. */
  sourceType?: string;
  /** A registered source's scope (see `SourceTypeLogsDrilldownScope`). */
  scope?: SourceTypeLogsDrilldownScope;
}

type DrilldownSourceType = SourceTypeDefinition & { logsDrilldown: SourceTypeLogsDrilldown };

/** Sources offered on the page: OpenSearch, then registered Logs sources that support it. */
const getDrilldownSourceTypes = (): SourceTypeDefinition[] => {
  try {
    return getSourceTypeRegistry()
      .getAll(ExploreFlavor.Logs)
      .filter(
        (sourceType) => sourceType.id === OPENSEARCH_SOURCE_TYPE_ID || !!sourceType.logsDrilldown
      );
  } catch {
    // No registry (e.g. the page rendered on its own in a test): OpenSearch only, no picker.
    return [];
  }
};

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
    const fromUrl = urlStateStorage?.get<DrilldownAppState>('_a')?.dataSource;
    return fromUrl ?? sessionStore.get(DATA_SOURCE_STORAGE_KEY) ?? undefined;
    // Read once on mount; later changes are written out, not read back in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merges a change into `_a`, so the data source, source type and scope don't overwrite each other.
  const writeAppState = useCallback(
    (patch: Partial<DrilldownAppState>) => {
      const current = urlStateStorage?.get<DrilldownAppState>('_a') ?? {};
      urlStateStorage?.set('_a', { ...current, ...patch }, { replace: true });
    },
    [urlStateStorage]
  );

  // The sources offered here. Read once: sources register by the time an app mounts.
  const drilldownSourceTypes = useMemo(getDrilldownSourceTypes, []);

  // The selected source type and, for a registered one, its scope. A URL with `_a` wins (no
  // `sourceType` there means OpenSearch, e.g. a shared OpenSearch link); without `_a`, the per-tab
  // store; then OpenSearch. An unknown id (a source no longer registered) falls back to OpenSearch.
  const initialSource = useMemo(() => {
    const appState = urlStateStorage?.get<DrilldownAppState>('_a');
    const id: string | undefined = appState
      ? appState.sourceType
      : (sessionStore.get(SOURCE_TYPE_STORAGE_KEY) ?? undefined);
    const known = drilldownSourceTypes.some((sourceType) => sourceType.id === id);
    if (!id || !known || id === OPENSEARCH_SOURCE_TYPE_ID) {
      return { id: OPENSEARCH_SOURCE_TYPE_ID, scope: undefined };
    }
    const scope: SourceTypeLogsDrilldownScope | undefined = appState
      ? appState.scope
      : (sessionStore.get(SOURCE_SCOPE_STORAGE_KEY) ?? undefined);
    return { id, scope };
    // Read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sourceTypeId, setSourceTypeId] = useState(initialSource.id);
  const [sourceScope, setSourceScope] = useState<SourceTypeLogsDrilldownScope | undefined>(
    initialSource.scope
  );
  const registeredSource = useMemo(
    () =>
      sourceTypeId === OPENSEARCH_SOURCE_TYPE_ID
        ? undefined
        : (drilldownSourceTypes.find((sourceType) => sourceType.id === sourceTypeId) as
            DrilldownSourceType | undefined),
    [sourceTypeId, drilldownSourceTypes]
  );

  // Data source scoping the list (MDS). Local state, mirrored to the `_a` URL key.
  const [selectedDataSource, setSelectedDataSource] =
    useState<Dataset['dataSource']>(initialDataSource);
  const dataSource = selectedDataSource;
  const dataSourceId = dataSource?.id;

  // If the source was restored from the session store (the URL had no `_a`, e.g. re-entry from a
  // bare `#/`), seed it into the URL now so `_a` is authoritative immediately — shareable and
  // reload-safe without waiting for the picker to fire a change.
  useEffect(() => {
    if (!urlStateStorage?.get('_a')) {
      const seeded: DrilldownAppState = {
        ...(initialDataSource ? { dataSource: initialDataSource } : {}),
        ...(initialSource.id !== OPENSEARCH_SOURCE_TYPE_ID
          ? { sourceType: initialSource.id, scope: initialSource.scope }
          : {}),
      };
      if (Object.keys(seeded).length) urlStateStorage?.set('_a', seeded, { replace: true });
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
  // Only its label and onClick are read here, so OpenSearch's and a registered source's both fit.
  const [batchAction, setBatchAction] = useState<SourceBatchAction | null>(null);

  // Reset the one-time "permission denied" toast whenever the data source changes: a different source
  // is a fresh permission context, so its own failures should be allowed to toast once.
  useEffect(() => {
    resetPermissionToast();
  }, [dataSourceId]);

  // Page breadcrumb. This standalone app has no explore tab chrome, so it sets its own.
  useEffect(() => {
    services.chrome.setBreadcrumbs([
      {
        text: i18n.translate('explore.logsDrilldown.breadcrumb', {
          defaultMessage: 'Explore logs',
        }),
      },
    ]);
  }, [services.chrome]);

  // Global time range mirror, so the date picker reflects + drives the shared timefilter.
  const [time, setTime] = useState(() => timefilter.getTime());
  useEffect(() => {
    const sub = timefilter.getTimeUpdate$().subscribe(() => setTime(timefilter.getTime()));
    // The URL sync above runs first and may already have set the range from `_g` before this
    // subscription existed; read it once, or the picker shows the old range while every card
    // queries the URL's (which on a billed source scans more than the picker says).
    setTime(timefilter.getTime());
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
      writeAppState({ dataSource: nextDataSource });
      // Also remember it per-tab so re-entry from a bare `#/` (nav-popover / query-bar) restores it.
      if (nextDataSource) sessionStore.set(DATA_SOURCE_STORAGE_KEY, nextDataSource);
      else sessionStore.remove(DATA_SOURCE_STORAGE_KEY);
    },
    [writeAppState, sessionStore]
  );

  // Follow `_a` changes the page didn't make (a hand-edited URL, back/forward within the app): the
  // page reads `_a` on mount only, and its own writes come back here equal to its state (no-ops).
  const [dataSourceControlKey, setDataSourceControlKey] = useState(0);
  const pageStateRef = useRef({ sourceTypeId, sourceScope, dataSourceId });
  pageStateRef.current = { sourceTypeId, sourceScope, dataSourceId };
  useEffect(() => {
    if (!urlStateStorage?.change$) return;
    const sub = urlStateStorage.change$<DrilldownAppState>('_a').subscribe((appState) => {
      if (!appState) return;
      const current = pageStateRef.current;
      const wanted = appState.sourceType ?? OPENSEARCH_SOURCE_TYPE_ID;
      const known =
        wanted === OPENSEARCH_SOURCE_TYPE_ID ||
        drilldownSourceTypes.some((sourceType) => sourceType.id === wanted);
      if (known && wanted !== current.sourceTypeId) {
        setSourceTypeId(wanted);
        setSourceScope(wanted === OPENSEARCH_SOURCE_TYPE_ID ? undefined : appState.scope);
        setBatchAction(null);
      } else if (
        known &&
        wanted !== OPENSEARCH_SOURCE_TYPE_ID &&
        JSON.stringify(appState.scope ?? null) !== JSON.stringify(current.sourceScope ?? null)
      ) {
        setSourceScope(appState.scope);
        setBatchAction(null);
      }
      const nextDataSourceId = appState.dataSource?.id;
      if (nextDataSourceId && nextDataSourceId !== current.dataSourceId) {
        setSelectedDataSource(appState.dataSource);
        setDataSourceResolved(true);
        setDataSourceControlKey((n) => n + 1);
      }
    });
    return () => sub.unsubscribe();
  }, [urlStateStorage, drilldownSourceTypes]);

  const onSourceTypeChange = useCallback(
    (id: string) => {
      if (id === sourceTypeId) return;
      setSourceTypeId(id);
      // A new source starts from its picker's default scope; the search is per source too.
      setSourceScope(undefined);
      setSearchInput('');
      setSearch('');
      setBatchAction(null);
      const isOpenSearch = id === OPENSEARCH_SOURCE_TYPE_ID;
      writeAppState({ sourceType: isOpenSearch ? undefined : id, scope: undefined });
      if (isOpenSearch) sessionStore.remove(SOURCE_TYPE_STORAGE_KEY);
      else sessionStore.set(SOURCE_TYPE_STORAGE_KEY, id);
      sessionStore.remove(SOURCE_SCOPE_STORAGE_KEY);
    },
    [sourceTypeId, writeAppState, sessionStore]
  );

  const onScopeChange = useCallback(
    (scope: SourceTypeLogsDrilldownScope) => {
      setSourceScope(scope);
      setBatchAction(null);
      writeAppState({ scope });
      sessionStore.set(SOURCE_SCOPE_STORAGE_KEY, scope);
    },
    [writeAppState, sessionStore]
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
        // No `updateButtonProps={{ fill: true }}` here, unlike the query views' Refresh: this
        // picker disables its own update button on an invalid typed range, and that state is
        // internal (onTimeChange can't fire while disabled, so there's nothing to gate fill on).
        // Filled + disabled reads as enabled; OUI's hollow default is correct throughout.
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
        {drilldownSourceTypes.length > 1 && (
          <EuiFlexItem grow={false} className="logsDrilldown__toolbarSourceType">
            <SourceTypeControl
              options={drilldownSourceTypes.map((sourceType) => ({
                id: sourceType.id,
                label: getSourceTypeRegistry().getLabel(sourceType, ExploreFlavor.Logs),
              }))}
              selectedId={sourceTypeId}
              onChange={onSourceTypeChange}
            />
          </EuiFlexItem>
        )}
        <EuiFlexItem
          grow={false}
          // OpenSearch's data source picker keeps its fixed width; a source's own picker sizes to
          // its content, so the search box starts right after it.
          className={registeredSource ? 'logsDrilldown__toolbarScope' : 'logsDrilldown__toolbarDs'}
        >
          {registeredSource ? (
            <registeredSource.logsDrilldown.ScopeSelector
              scope={sourceScope}
              onChange={onScopeChange}
              data={services.data}
            />
          ) : (
            <DataSourceControl
              // Remounted when the URL changes the data source from outside (see below).
              key={dataSourceControlKey}
              services={services}
              onChange={onDataSourceChange}
              // The data source in use, not the one the page opened with: the picker remounts when
              // the user comes back from another source, and reports this one as selected.
              defaultDataSourceId={dataSourceId ?? initialDataSource?.id}
            />
          )}
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFieldSearch
            compressed
            fullWidth
            isClearable
            placeholder={
              registeredSource
                ? (registeredSource.logsDrilldown.searchPlaceholder ??
                  i18n.translate('explore.logsDrilldown.source.searchPlaceholder', {
                    defaultMessage: 'Search…',
                  }))
                : i18n.translate('explore.logsDrilldown.searchPlaceholder', {
                    defaultMessage: 'Search datasets and indexes…',
                  })
            }
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
                : registeredSource
                  ? i18n.translate('explore.logsDrilldown.source.openInLogsDisabledTip', {
                      defaultMessage: 'Select one or more items to open them in Logs',
                    })
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
                (registeredSource
                  ? i18n.translate('explore.logsDrilldown.source.openInLogsDefault', {
                      defaultMessage: 'Open in Logs',
                    })
                  : i18n.translate('explore.logsDrilldown.rows.createDataset', {
                      defaultMessage: 'Create dataset',
                    }))}
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
      drilldownSourceTypes,
      sourceTypeId,
      onSourceTypeChange,
      registeredSource,
      sourceScope,
      onScopeChange,
      dataSourceControlKey,
      dataSourceId,
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
      {registeredSource ? (
        sourceScope ? (
          <SourceRowsView
            key={registeredSource.id}
            services={services}
            sourceType={registeredSource}
            scope={sourceScope}
            search={search}
            refreshKey={refreshKey}
            onBrushTime={onBrushTime}
            onBatchActionChange={setBatchAction}
          />
        ) : (
          <EuiEmptyPrompt
            iconType="search"
            data-test-subj="logsDrilldownSelectScope"
            title={
              <h2>
                {i18n.translate('explore.logsDrilldown.selectScope.title', {
                  defaultMessage: 'Choose what to explore',
                })}
              </h2>
            }
            body={
              <p>
                {i18n.translate('explore.logsDrilldown.selectScope.body', {
                  defaultMessage: 'Use the picker above to choose where {source} lists from.',
                  values: {
                    source: getSourceTypeRegistry().getLabel(registeredSource, ExploreFlavor.Logs),
                  },
                })}
              </p>
            }
          />
        )
      ) : canQueryIndexes ? (
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
