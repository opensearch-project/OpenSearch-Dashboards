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
  EuiHealth,
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
  name: string;
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
  /** Index creation time (epoch ms) — shown as "created {age}" in the empty-index compact row. */
  createdAt?: number;
  /** Humanized selected-range label (e.g. "15 minutes") for the no-recent-data copy. */
  rangeLabel: string;
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

// Inline log-stream height — the card shows the latest N lines; matches the histogram column height
// so the two columns' bottoms align (#7).
const LOGS_MAX_HEIGHT = 132;
const HIST_HEIGHT = 132;

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
  kind,
  isRemote,
  isTimeBased,
  rowState,
  severityField,
  timeFieldName,
  dateFields,
  docsCount,
  health,
  createdAt,
  rangeLabel,
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
  const checkboxProps = {
    id: `logsDrilldownCheckCard-${name}`,
    checked,
    onChange: onToggleCheck,
    ariaLabel: i18n.translate('explore.logsDrilldown.rows.selectForCreate', {
      defaultMessage: 'Select {name} for dataset creation',
      values: { name },
    }),
  };

  // ---- Compact variants (a card whose body carries nothing to scan → one row) --------------------

  // 05 · No time field: collapsed, non-actionable, explains WHY.
  if (rowState === LogRowState.NO_TIME_FIELD) {
    return (
      <div ref={cardRef} data-test-subj={`logsExploreCard-${name}`}>
        <CompactRow
          icon="clock"
          name={name}
          message={i18n.translate('explore.logsDrilldown.rows.noTimeField', {
            defaultMessage: 'No time field — can’t chart or create a dataset',
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
          name={name}
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
          name={name}
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

  // 02 · No events in range: healthy index, wrong window → compact, name still actionable.
  if (rowState === LogRowState.NO_RECENT) {
    return (
      <div ref={cardRef} data-test-subj={`logsExploreCard-${name}`}>
        <CompactRow
          icon={icon}
          name={name}
          nameOnClick={onPrimary}
          nameTitle={primaryLabel}
          message={i18n.translate('explore.logsDrilldown.rows.noEventsInRange', {
            defaultMessage: 'No events in the last {range}',
            values: { range: rangeLabel },
          })}
          tone="subdued"
          checkbox={checkboxProps}
          data-test-subj="logsExploreCardNoRecent"
        />
      </div>
    );
  }

  // ---- Full card (FULL / LOADING) ----------------------------------------------------------------

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

  // Header time-field control: ALWAYS an EuiSelect for a uniform look, but disabled (non-interactive)
  // when there's only one date field so single- and multi-timestamp indexes present identically.
  // Datasets carry a single `timeFieldName` and no `dateFields` list → single, disabled option.
  const hasMultipleTimeFields = !!dateFields && dateFields.length > 1;
  const canSwitchTimeField = !!onTimeFieldChange && hasMultipleTimeFields;
  const timeFieldOptions = hasMultipleTimeFields
    ? dateFields!.map((f) => ({ value: f, text: f }))
    : timeFieldName
    ? [{ value: timeFieldName, text: timeFieldName }]
    : [];
  const timeControl = timeFieldName ? (
    <EuiToolTip
      content={
        canSwitchTimeField
          ? i18n.translate('explore.logsDrilldown.rows.timeFieldSwitchTip', {
              defaultMessage: 'Time field used for the histogram and sort — switch it here',
            })
          : i18n.translate('explore.logsDrilldown.rows.timeFieldTip', {
              defaultMessage: 'Time field used for the histogram and sort',
            })
      }
    >
      <EuiSelect
        compressed
        disabled={!canSwitchTimeField}
        prepend={<EuiIcon type="clock" size="s" />}
        options={timeFieldOptions}
        value={timeFieldName}
        onChange={(e) => onTimeFieldChange?.(e.target.value)}
        aria-label={i18n.translate('explore.logsDrilldown.rows.timeFieldAria', {
          defaultMessage: 'Select the time field',
        })}
        className="logStreamCard__timeSelect"
        data-test-subj="logsExploreCardTimeFieldSelect"
      />
    </EuiToolTip>
  ) : null;

  // Dataset utility actions (next to the time control): an explicit "Show logs" (mirrors the name
  // link) and "Manage" (opens the dataset in index-pattern management).
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
              {i18n.translate('explore.logsDrilldown.rows.showLogs', {
                defaultMessage: 'Show logs',
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

  // Index health dot (green/yellow/red) from cat.indices — a compact status affordance in the header.
  const healthDot =
    kind === 'index' && health ? (
      <EuiFlexItem grow={false} className="logStreamCard__health">
        <EuiToolTip
          content={i18n.translate('explore.logsDrilldown.rows.healthTip', {
            defaultMessage: 'Index health: {health}',
            values: { health },
          })}
        >
          <EuiHealth
            color={health}
            data-test-subj={`logsExploreCardHealth-${name}`}
            aria-label={i18n.translate('explore.logsDrilldown.rows.healthAria', {
              defaultMessage: 'Index health {health}',
              values: { health },
            })}
          >
            {''}
          </EuiHealth>
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
      <EuiPanel hasBorder paddingSize="s" hasShadow={false}>
        {/* Header. Only raw indexes are selectable for batch dataset creation — a dataset already
            exists, so it gets no selection checkbox. */}
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap={false}>
          {kind === 'index' && (
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
          {healthDot}
          <EuiFlexItem style={{ minWidth: 0 }}>
            <EuiText size="s" className="logStreamCard__name">
              {onPrimary ? (
                <EuiLink
                  onClick={onPrimary}
                  title={primaryLabel}
                  data-test-subj="logsExploreCardNameLink"
                >
                  <strong>{name}</strong>
                </EuiLink>
              ) : (
                <strong>{name}</strong>
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
