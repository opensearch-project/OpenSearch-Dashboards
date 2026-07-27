/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import moment from 'moment';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTextColor,
  EuiLink,
  EuiIcon,
  EuiToken,
  EuiCheckbox,
  EuiToolTip,
  EuiSelect,
  EuiFieldText,
  EuiButtonEmpty,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../types';
import { PreviewResult } from '../hooks/fetch_preview';
import { HistogramResult } from '../hooks/fetch_histogram';
import { LogRowState } from '../row_state';
import { SeverityHistogram } from './severity_histogram';
import { LogLine } from './log_line';
import { CardSkeleton, LogLinesSkeleton } from './card_skeleton';
import { CompactRow } from './compact_row';

export interface CardData {
  preview?: PreviewResult;
  histogram?: HistogramResult;
  error?: string;
  loading: boolean;
}

interface Props {
  services: ExploreServices;
  /** Identity: the index/pattern name. Used for test-subj, keys, and the viewport observer. */
  name: string;
  /** Visible label — defaults to `name`. For datasets with a friendly displayName, this is that
   *  name while `name` stays the pattern (identity). */
  label?: string;
  kind: 'index' | 'dataset';
  isRemote?: boolean;
  isTimeBased: boolean;
  /** The resolved visual state (full card vs. one of the compact variants). */
  rowState: LogRowState;
  severityField?: string;
  timeFieldName?: string;
  /** All date fields on the index (for the time-field selector); >1 → selector is shown. */
  dateFields?: string[];
  /** Doc count from cat.indices — shown in the empty-index compact row. */
  docsCount?: number;
  /** Cluster-health of the index (green/yellow/red) from cat.indices — shown as a header dot. */
  health?: 'green' | 'yellow' | 'red';
  /** Store size / shard counts from cat.indices — shown in the health-pill tooltip. */
  storeSize?: string;
  primaryShards?: number;
  replicaCount?: number;
  /** Index creation time (epoch ms) — shown as "created {age}" in the empty-index compact row. */
  createdAt?: number;
  data: CardData;
  /** The primary action label ("Query" / "Create dataset"); titles the name link. */
  primaryLabel: string;
  /** Runs the primary action. Undefined ⇒ the name is non-actionable (e.g. empty index). */
  onPrimary?: () => void;
  checked: boolean;
  onToggleCheck: () => void;
  onVisibilityChange: (name: string, visible: boolean) => void;
  /** Brush-select on the histogram → update the global time range. */
  onBrushTime: (from: number, to: number) => void;
  /** User picked a different time field for this index → re-query preview + histogram. */
  onTimeFieldChange?: (field: string) => void;
  /** Retry a failed preview (state 04). */
  onRetry?: () => void;
  /** Dataset cards only: open this dataset in index-pattern management. */
  onManage?: () => void;
}

// Inline log-stream height — sized to a whole number of ~20.7px log lines (6 × 20.7 ≈ 124px) so no
// line is ever geometrically half-cut at the bottom on initial load. HIST_HEIGHT matches it exactly
// so the histogram and log columns' bottoms stay aligned (#7).
const LOGS_MAX_HEIGHT = 124;
const HIST_HEIGHT = 124;

// Distinct icons matching manage-workspace / dataset management.
const ICON_INDEX = 'logoOpenSearch';
const ICON_DATASET = 'indexPatternApp';

/**
 * One card in the Rows view. Resolves to a full histogram+logs card (FULL/LOADING) or to a compact
 * one-row treatment (NO_RECENT / EMPTY_INDEX / ERROR / NO_TIME_FIELD) via {@link CompactRow}. The
 * NAME is the primary action everywhere (no per-row button); empty-index / no-time-field names are
 * non-actionable. Fetches are viewport-gated by the parent through IntersectionObserver.
 */
export const LogStreamCard: React.FC<Props> = ({
  services,
  name,
  label,
  kind,
  isRemote,
  isTimeBased,
  rowState,
  severityField,
  timeFieldName,
  dateFields,
  docsCount,
  health,
  storeSize,
  primaryShards,
  replicaCount,
  createdAt,
  data,
  primaryLabel,
  onPrimary,
  checked,
  onToggleCheck,
  onVisibilityChange,
  onBrushTime,
  onTimeFieldChange,
  onRetry,
  onManage,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => onVisibilityChange(name, entry.isIntersecting),
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      onVisibilityChange(name, false);
    };
  }, [name, onVisibilityChange]);

  const icon = kind === 'dataset' ? ICON_DATASET : ICON_INDEX;
  // The visible label (friendly dataset name when present) — falls back to the identity `name`.
  const displayLabel = label || name;
  // Only raw indexes are selectable for batch dataset creation — a dataset already exists, so it
  // gets no selection checkbox (in the full card OR the compact variants). Undefined ⇒ CompactRow
  // renders no checkbox.
  const checkboxProps =
    kind === 'index'
      ? {
          id: `logsDrilldownCheckCard-${name}`,
          checked,
          onChange: onToggleCheck,
          ariaLabel: i18n.translate('explore.logsDrilldown.rows.selectForCreate', {
            defaultMessage: 'Select {name} for dataset creation',
            values: { name },
          }),
        }
      : undefined;

  // ---- Compact variants (a card whose body carries nothing to scan → one row) --------------------

  // 05 · No time field: collapsed, non-actionable, explains WHY.
  if (rowState === LogRowState.NO_TIME_FIELD) {
    return (
      <div ref={cardRef} data-test-subj={`logsExploreCard-${name}`}>
        <CompactRow
          icon="clock"
          name={displayLabel}
          message={i18n.translate('explore.logsDrilldown.rows.noTimeField', {
            defaultMessage: 'No time field found, can’t create a logs dataset',
          })}
          tone="subdued"
          data-test-subj="logsExploreCardNoTimeBadge"
        />
      </div>
    );
  }

  // 03 · Empty index (zero docs ever): non-actionable, no checkbox, shows count + age.
  if (rowState === LogRowState.EMPTY_INDEX) {
    const age = createdAt ? moment(createdAt).fromNow() : undefined;
    const meta = [
      i18n.translate('explore.logsDrilldown.rows.docsCount', {
        defaultMessage: '{count} docs',
        values: { count: docsCount ?? 0 },
      }),
      age &&
        i18n.translate('explore.logsDrilldown.rows.createdAge', {
          defaultMessage: 'created {age}',
          values: { age },
        }),
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <div ref={cardRef} data-test-subj={`logsExploreCard-${name}`}>
        <CompactRow
          icon={icon}
          name={displayLabel}
          message={i18n.translate('explore.logsDrilldown.rows.noDocsYet', {
            defaultMessage: 'No documents yet',
          })}
          meta={meta}
          tone="subdued"
          data-test-subj="logsExploreCardEmptyIndex"
        />
      </div>
    );
  }

  // 04 · Fetch error: danger (or warning for partial-shard) row with the error + Retry.
  if (rowState === LogRowState.ERROR) {
    const errorText = data.error ?? '';
    const isPartial = /shard|partial|_shards/i.test(errorText);
    return (
      <div ref={cardRef} data-test-subj={`logsExploreCard-${name}`}>
        <CompactRow
          icon={icon}
          name={displayLabel}
          nameOnClick={onPrimary}
          nameTitle={primaryLabel}
          message={i18n.translate('explore.logsDrilldown.rows.previewError', {
            defaultMessage: 'Couldn’t load preview',
          })}
          tone={isPartial ? 'warning' : 'danger'}
          errorText={errorText}
          action={
            onRetry && (
              <EuiLink onClick={onRetry} data-test-subj="logsExploreCardRetry">
                {i18n.translate('explore.logsDrilldown.rows.retry', { defaultMessage: 'Retry' })}
              </EuiLink>
            )
          }
          checkbox={checkboxProps}
          data-test-subj="logsExploreCardError"
        />
      </div>
    );
  }

  // 02 · No events in range: the index/dataset HAS data, just none in the selected window (commonly a
  // wrong default time range vs. a different time field). Render the FULL card — not a stripped compact
  // row — so the header meta controls (time-field selector, index health, Query/Manage) stay available;
  // switching the time field here is exactly what lets the user find their data. The histogram column
  // shows its own "No data in the selected time range" state and the log stream shows the empty message.
  // (NO_RECENT rows are still demoted into the collapsed drawer by rows_view via `isDead`.)

  // ---- Full card (FULL / LOADING / NO_RECENT) ----------------------------------------------------

  const rows = data.preview?.rows ?? [];

  const logStream = (
    <div
      className="logStreamCard__logs"
      style={{ maxHeight: LOGS_MAX_HEIGHT }}
      data-test-subj="logsExploreCardLogs"
    >
      {data.loading && rows.length === 0 ? (
        <LogLinesSkeleton />
      ) : rows.length === 0 ? (
        // A zero-total time-based index becomes a NO_RECENT compact row before reaching here, so this
        // path is a safety net for the not-yet-classified / dataset case.
        <EuiText size="xs" color="subdued" className="logStreamCard__empty">
          {i18n.translate('explore.logsDrilldown.rows.noDocs', {
            defaultMessage: 'No documents in the selected time range.',
          })}
        </EuiText>
      ) : (
        rows.map((row, i) => (
          <LogLine
            key={i}
            row={row}
            timeFieldName={timeFieldName}
            severityField={severityField}
            truncated
          />
        ))
      )}
    </div>
  );

  // Header time-field control. When there's a real choice (multi-timestamp index + a change handler)
  // it's an interactive EuiSelect; otherwise a read-only compressed field with the same clock-prepend
  // look — NOT a disabled select (which greys out and reads as broken). Single- and multi-timestamp
  // cards stay visually uniform; the single case simply has no dropdown caret.
  const hasMultipleTimeFields = !!dateFields && dateFields.length > 1;
  const canSwitchTimeField = !!onTimeFieldChange && hasMultipleTimeFields;
  const timeControl = timeFieldName ? (
    canSwitchTimeField ? (
      <EuiToolTip
        anchorClassName="logStreamCard__timeCapsule"
        content={i18n.translate('explore.logsDrilldown.rows.timeFieldSwitchTip', {
          defaultMessage: 'Time field: {field} — used for the histogram and sort. Switch it here.',
          values: { field: timeFieldName },
        })}
      >
        <EuiSelect
          compressed
          prepend={<EuiIcon type="clock" size="s" />}
          options={dateFields!.map((f) => ({ value: f, text: f }))}
          value={timeFieldName}
          onChange={(e) => onTimeFieldChange?.(e.target.value)}
          aria-label={i18n.translate('explore.logsDrilldown.rows.timeFieldAria', {
            defaultMessage: 'Select the time field',
          })}
          className="logStreamCard__timeSelect"
          data-test-subj="logsExploreCardTimeFieldSelect"
        />
      </EuiToolTip>
    ) : (
      <EuiToolTip
        anchorClassName="logStreamCard__timeCapsule"
        content={i18n.translate('explore.logsDrilldown.rows.timeFieldTip', {
          defaultMessage: 'Time field: {field} — used for the histogram and sort',
          values: { field: timeFieldName },
        })}
      >
        <EuiFieldText
          compressed
          readOnly
          prepend={<EuiIcon type="clock" size="s" />}
          value={timeFieldName}
          aria-label={i18n.translate('explore.logsDrilldown.rows.timeFieldAria', {
            defaultMessage: 'Select the time field',
          })}
          className="logStreamCard__timeSelect"
          data-test-subj="logsExploreCardTimeFieldReadonly"
        />
      </EuiToolTip>
    )
  ) : null;

  // Dataset utility actions (next to the time control): an explicit "Query" action (mirrors the name
  // link — opens the dataset in the logs Query experience) and "Manage" (opens the dataset in
  // index-pattern management).
  const datasetActions =
    kind === 'dataset' ? (
      <>
        {onPrimary && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              iconType="play"
              onClick={onPrimary}
              data-test-subj="logsExploreCardShowLogs"
            >
              {i18n.translate('explore.logsDrilldown.rows.queryDataset', {
                defaultMessage: 'Query',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
        {onManage && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              iconType="gear"
              onClick={onManage}
              data-test-subj="logsExploreCardManage"
            >
              {i18n.translate('explore.logsDrilldown.rows.manageDataset', {
                defaultMessage: 'Manage',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
      </>
    ) : null;

  // Index health (green/yellow/red) from cat.indices, shown right of the time control as a labeled
  // capsule pill (dot + status word) rather than a bare colored dot. green→Healthy (all shards
  // allocated), yellow→Degraded (replicas unassigned), red→Unhealthy (primaries unassigned).
  const HEALTH_LABELS: Record<'green' | 'yellow' | 'red', string> = {
    green: i18n.translate('explore.logsDrilldown.rows.healthHealthy', {
      defaultMessage: 'Healthy',
    }),
    yellow: i18n.translate('explore.logsDrilldown.rows.healthDegraded', {
      defaultMessage: 'Degraded',
    }),
    red: i18n.translate('explore.logsDrilldown.rows.healthUnhealthy', {
      defaultMessage: 'Unhealthy',
    }),
  };
  // Rich hover tooltip: the raw cat.indices health status as-is (green/yellow/red), plus the store
  // size / shard layout. Each metadata row is shown only when that value is known (remote/closed
  // indexes omit them).
  const healthTooltip = (
    <div className="logStreamCard__healthTip" data-test-subj={`logsExploreCardHealthTip-${name}`}>
      {health && (
        <div className="logStreamCard__healthTipTitle">
          {i18n.translate('explore.logsDrilldown.rows.healthTipStatus', {
            defaultMessage: 'Status: {health}',
            values: { health },
          })}
        </div>
      )}
      {storeSize && (
        <div>
          {i18n.translate('explore.logsDrilldown.rows.healthTipSize', {
            defaultMessage: 'Store size: {size}',
            values: { size: storeSize },
          })}
        </div>
      )}
      {primaryShards != null && (
        <div>
          {i18n.translate('explore.logsDrilldown.rows.healthTipPrimaries', {
            defaultMessage: 'Primaries: {count}',
            values: { count: primaryShards },
          })}
        </div>
      )}
      {replicaCount != null && (
        <div>
          {i18n.translate('explore.logsDrilldown.rows.healthTipReplicas', {
            defaultMessage: 'Replicas: {count}',
            values: { count: replicaCount },
          })}
        </div>
      )}
    </div>
  );
  const healthPill =
    kind === 'index' && health ? (
      <EuiFlexItem grow={false} className="logStreamCard__health">
        <EuiToolTip content={healthTooltip}>
          <span
            className={`logStreamCard__healthPill logStreamCard__healthPill--${health}`}
            data-test-subj={`logsExploreCardHealth-${name}`}
            aria-label={i18n.translate('explore.logsDrilldown.rows.healthAria', {
              defaultMessage: 'Index health {health}',
              values: { health },
            })}
          >
            <span className="logStreamCard__healthDot" />
            {HEALTH_LABELS[health]}
          </span>
        </EuiToolTip>
      </EuiFlexItem>
    ) : null;

  const histogramCol = (
    <EuiFlexItem
      grow={false}
      className="logStreamCard__histCol"
      style={{ flex: '0 0 360px', maxWidth: 360, minWidth: 0 }}
    >
      {data.histogram ? (
        <SeverityHistogram
          services={services}
          histogram={data.histogram}
          onBrush={onBrushTime}
          chartId={name}
        />
      ) : data.loading ? (
        <CardSkeleton height={HIST_HEIGHT} />
      ) : (
        // Preview succeeded but the (best-effort) histogram failed — logs still render.
        <div className="logStreamCard__histEmpty" style={{ height: HIST_HEIGHT }}>
          <EuiText size="xs" color="subdued">
            {i18n.translate('explore.logsDrilldown.rows.histError', {
              defaultMessage: 'Histogram unavailable',
            })}
          </EuiText>
        </div>
      )}
    </EuiFlexItem>
  );

  return (
    <div ref={cardRef} className="logStreamCard" data-test-subj={`logsExploreCard-${name}`}>
      <EuiPanel hasBorder paddingSize="s" hasShadow={false} className="logStreamCard__panel">
        {/* Header. Only raw indexes are selectable for batch dataset creation — a dataset already
            exists, so it gets no selection checkbox. */}
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap={false}>
          {checkboxProps && (
            <EuiFlexItem grow={false}>
              <EuiCheckbox
                id={checkboxProps.id}
                checked={checked}
                onChange={onToggleCheck}
                aria-label={checkboxProps.ariaLabel}
                data-test-subj={`logsExploreCardCheckbox-${name}`}
              />
            </EuiFlexItem>
          )}
          <EuiFlexItem grow={false}>
            <EuiIcon type={icon} size="s" />
          </EuiFlexItem>
          <EuiFlexItem style={{ minWidth: 0 }}>
            <EuiText size="s" className="logStreamCard__name">
              {onPrimary ? (
                <EuiLink
                  onClick={onPrimary}
                  title={primaryLabel}
                  data-test-subj="logsExploreCardNameLink"
                >
                  <strong>{displayLabel}</strong>
                </EuiLink>
              ) : (
                <strong>{displayLabel}</strong>
              )}{' '}
              <EuiTextColor color="subdued">
                <small>
                  {kind === 'dataset'
                    ? i18n.translate('explore.logsDrilldown.rows.datasetLabel', {
                        defaultMessage: 'Dataset',
                      })
                    : i18n.translate('explore.logsDrilldown.rows.indexLabel', {
                        defaultMessage: 'Index',
                      })}
                </small>
              </EuiTextColor>
            </EuiText>
          </EuiFlexItem>
          {isRemote && (
            <EuiFlexItem grow={false}>
              <EuiToolTip
                content={i18n.translate('explore.logsDrilldown.rows.remote', {
                  defaultMessage: 'Cross-cluster (remote)',
                })}
              >
                <EuiToken iconType="tokenNamespace" size="s" />
              </EuiToolTip>
            </EuiFlexItem>
          )}
          {timeControl && (
            <EuiFlexItem grow={false} className="logStreamCard__timeControl">
              {timeControl}
            </EuiFlexItem>
          )}
          {healthPill}
          {datasetActions}
        </EuiFlexGroup>

        {/* Body */}
        <div className="logStreamCard__body">
          {isTimeBased ? (
            <EuiFlexGroup
              gutterSize="m"
              responsive={false}
              wrap={false}
              alignItems="stretch"
              className="logStreamCard__split"
            >
              {histogramCol}
              <EuiFlexItem grow={true} className="logStreamCard__logCol">
                {logStream}
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            // Not yet classified (time-based unknown) → full-width logs.
            logStream
          )}
        </div>
      </EuiPanel>
    </div>
  );
};
