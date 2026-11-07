/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  EuiButton,
  EuiEmptyPrompt,
  EuiErrorBoundary,
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
  SourceTypeLogsDrilldownScope,
} from '../../../services/source_type_registry';
import { ExploreServices } from '../../../types';
import { DataSourceControl } from './components/data_source_control';
import { RowsView } from './components/rows_view';
import { SourceRowsView } from './components/source_rows_view';
import { SourceTypeControl } from './components/source_type_control';
import { DATA_SOURCE_STORAGE_KEY, SOURCE_STORAGE_KEY } from './constants';
import { useIndexClassification } from './hooks/use_index_classification';
import { appStateFor, drilldownPageReducer, DrilldownPageState } from './page_state';
import { resetPermissionToast } from './permission_toast';
import { stableKey } from './stable_key';
import { DrilldownAppState, DrilldownSourceType } from './types';

const SEARCH_DEBOUNCE_MS = 300;

const isDrilldownSourceType = (
  sourceType: SourceTypeDefinition | undefined
): sourceType is DrilldownSourceType => !!sourceType?.logsDrilldown;

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
 * self-contained: no explore Redux store; the page's state is local (`page_state.ts`), the global
 * time range drives the previews, and activating/creating a dataset hands off to the logs Query app.
 */
export const LogsDrilldownPage: React.FC<Props> = ({ services, setHeaderActionMenu }) => {
  const timefilter = services.data.query.timefilter.timefilter;
  const urlStateStorage = services.osdUrlStateStorage;

  // Per-tab session store: re-entry from a bare `#/` (the nav-popover and query-bar entry points
  // open the page with no `_a`) restores the last selection. A URL `_a` always wins (shareable).
  const sessionStore = useMemo(() => new Storage(window.sessionStorage), []);

  // The sources offered here. Read once: sources register by the time an app mounts.
  const drilldownSourceTypes = useMemo(getDrilldownSourceTypes, []);
  const knownSourceTypeIds = useMemo(
    () => drilldownSourceTypes.map((sourceType) => sourceType.id),
    [drilldownSourceTypes]
  );

  // The page's state on mount: the URL's `_a` when there is one (no `sourceType` there means
  // OpenSearch, e.g. a shared OpenSearch link); else the tab's session; then OpenSearch. An unknown
  // source (no longer registered) falls back to OpenSearch.
  const initialState = useMemo((): DrilldownPageState => {
    const appState = urlStateStorage?.get<DrilldownAppState>('_a') ?? undefined;
    const stored: Pick<DrilldownAppState, 'sourceType' | 'scope'> | undefined = appState
      ? undefined
      : (sessionStore.get(SOURCE_STORAGE_KEY) ?? undefined);
    const wanted = appState ? appState.sourceType : stored?.sourceType;
    const known =
      !!wanted && wanted !== OPENSEARCH_SOURCE_TYPE_ID && knownSourceTypeIds.includes(wanted);
    const dataSource: Dataset['dataSource'] | undefined =
      appState?.dataSource ?? sessionStore.get(DATA_SOURCE_STORAGE_KEY) ?? undefined;
    return {
      sourceTypeId: known ? wanted! : OPENSEARCH_SOURCE_TYPE_ID,
      scope: known ? (appState ? appState.scope : stored?.scope) : undefined,
      dataSource,
      // A restored data source shows its list right away on reload; the picker confirms it.
      dataSourceResolved: !!dataSource?.id,
      dataSourcePickerKey: 0,
      searchInput: '',
      search: '',
      batchAction: null,
    };
    // Read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [state, dispatch] = useReducer(drilldownPageReducer, initialState);
  const { sourceTypeId, scope: sourceScope, dataSource, dataSourceResolved, batchAction } = state;
  const dataSourceId = dataSource?.id;
  const registeredSource = useMemo(() => {
    if (sourceTypeId === OPENSEARCH_SOURCE_TYPE_ID) return undefined;
    const found = drilldownSourceTypes.find((sourceType) => sourceType.id === sourceTypeId);
    return isDrilldownSourceType(found) ? found : undefined;
  }, [sourceTypeId, drilldownSourceTypes]);

  // Persist the source, scope and data source to `_a` (merged, so other keys stay) and to the tab's
  // session, from one place. The last `_a` written (key-sorted, as rison keeps it) lets the URL
  // listener below tell the page's own writes from outside changes.
  const lastWrittenAppState = useRef<string>();
  useEffect(() => {
    if (!urlStateStorage) return;
    const current = urlStateStorage.get<DrilldownAppState>('_a');
    const next = appStateFor({ sourceTypeId, scope: sourceScope, dataSource }, current);
    // Nothing to keep yet (OpenSearch, no data source, no `_a`): leave the URL as it is.
    if (!current && Object.keys(next).length === 0) return;
    const nextKey = stableKey(next);
    lastWrittenAppState.current = nextKey;
    if (stableKey(current ?? {}) !== nextKey) urlStateStorage.set('_a', next, { replace: true });
  }, [urlStateStorage, sourceTypeId, sourceScope, dataSource]);
  useEffect(() => {
    if (sourceTypeId === OPENSEARCH_SOURCE_TYPE_ID) sessionStore.remove(SOURCE_STORAGE_KEY);
    else sessionStore.set(SOURCE_STORAGE_KEY, { sourceType: sourceTypeId, scope: sourceScope });
  }, [sessionStore, sourceTypeId, sourceScope]);
  useEffect(() => {
    if (!dataSourceResolved) return;
    if (dataSource) sessionStore.set(DATA_SOURCE_STORAGE_KEY, dataSource);
    else sessionStore.remove(DATA_SOURCE_STORAGE_KEY);
  }, [sessionStore, dataSource, dataSourceResolved]);

  // Follow `_a` changes the page didn't make (a hand-edited URL, back/forward within the app). The
  // page's own writes come back here too, so a change is skipped when it equals the page's last
  // write (compared key-sorted), and when it isn't what the URL holds any more: the change of an
  // earlier write of the page's can arrive after a later one, and applying it would undo that.
  useEffect(() => {
    if (!urlStateStorage?.change$) return;
    const sub = urlStateStorage.change$<DrilldownAppState>('_a').subscribe((appState) => {
      if (!appState) return;
      const key = stableKey(appState);
      if (key === lastWrittenAppState.current) return;
      if (key !== stableKey(urlStateStorage.get<DrilldownAppState>('_a') ?? {})) return;
      dispatch({ type: 'applyExternalAppState', appState, knownSourceTypeIds });
    });
    return () => sub.unsubscribe();
  }, [urlStateStorage, knownSourceTypeIds]);

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

  // Shared, debounced search across the lists.
  const searchInput = state.searchInput;
  const search = state.search;
  useDebounce(() => dispatch({ type: 'commitSearch' }), SEARCH_DEBOUNCE_MS, [searchInput]);

  // The batch (multi-select) action the list reports up: drives the toolbar button.
  const setBatchAction = useCallback(
    (action: DrilldownPageState['batchAction']) => dispatch({ type: 'setBatchAction', action }),
    []
  );

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

  // refreshKey changes when the range OR the manual-refresh nonce changes → the lists re-fetch.
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

  const onDataSourceChange = useCallback((ds: { id?: string; title?: string }) => {
    dispatch({
      type: 'setDataSource',
      dataSource: ds.id
        ? ({ id: ds.id, title: ds.title ?? '', type: 'DATA_SOURCE' } as Dataset['dataSource'])
        : undefined,
    });
  }, []);

  const onSourceTypeChange = useCallback(
    (id: string) => dispatch({ type: 'selectSource', sourceTypeId: id }),
    []
  );

  const onScopeChange = useCallback(
    (scope: SourceTypeLogsDrilldownScope) => dispatch({ type: 'setScope', scope }),
    []
  );

  const dataSourcePickerKey = state.dataSourcePickerKey;
  const setSearchInput = useCallback(
    (value: string) => dispatch({ type: 'setSearchInput', value }),
    []
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
            // The source's own picker is another plugin's code: a throw stays in this slot.
            <EuiErrorBoundary>
              <registeredSource.logsDrilldown.ScopeSelector
                scope={sourceScope}
                onChange={onScopeChange}
                data={services.data}
              />
            </EuiErrorBoundary>
          ) : (
            <DataSourceControl
              // Remounted when the URL names another data source, so the picker validates it.
              key={dataSourcePickerKey}
              services={services}
              onChange={onDataSourceChange}
              // The data source in use (it starts from the URL or session, else the picker's
              // default): the picker remounts when the user comes back from another source.
              defaultDataSourceId={dataSourceId}
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
            aria-label={
              registeredSource
                ? (registeredSource.logsDrilldown.searchPlaceholder ??
                  i18n.translate('explore.logsDrilldown.source.searchAriaLabel', {
                    defaultMessage: 'Search',
                  }))
                : i18n.translate('explore.logsDrilldown.searchAriaLabel', {
                    defaultMessage: 'Search datasets and indexes',
                  })
            }
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
              isLoading={!!batchAction?.isLoading}
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
      dataSourcePickerKey,
      dataSourceId,
      searchInput,
      setSearchInput,
      batchAction,
      setHeaderActionMenu,
      datePicker,
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
          // The cards call the source's code (listing, grouping, its empty state): a throw shows
          // an error here instead of blanking the page.
          <EuiErrorBoundary key={registeredSource.id}>
            <SourceRowsView
              services={services}
              sourceType={registeredSource}
              scope={sourceScope}
              search={search}
              refreshKey={refreshKey}
              listRefreshKey={refreshNonce}
              onBrushTime={onBrushTime}
              onBatchActionChange={setBatchAction}
            />
          </EuiErrorBoundary>
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
