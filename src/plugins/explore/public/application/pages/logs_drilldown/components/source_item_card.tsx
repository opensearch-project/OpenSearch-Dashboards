/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiScreenReaderOnly,
  EuiText,
  EuiTextColor,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type { SourceTypeLogsDrilldownItem } from '../../../../services/source_type_registry';
import { ExploreServices } from '../../../../types';
import { SourceCardResult } from '../hooks/source_queries';
import { CardSkeleton, LogLinesSkeleton } from './card_skeleton';
import { LogLine } from './log_line';
import { SeverityHistogram } from './severity_histogram';

const HIST_HEIGHT = 124;
const LOGS_MAX_HEIGHT = 124;

interface Props {
  services: ExploreServices;
  item: SourceTypeLogsDrilldownItem;
  /** The source's icon (an EUI icon type or image URL). */
  icon?: string;
  /** Whether the source has a histogram (`fetchHistogram`). */
  hasHistogram: boolean;
  /** The card waits for its Run button (the source's dataset type requires an explicit run). */
  explicitRun: boolean;
  result?: SourceCardResult;
  error?: string;
  loading: boolean;
  /** The page's time range changed since the card ran. */
  stale: boolean;
  checked: boolean;
  /** Set when the selection is full: why this card can't be ticked. */
  checkDisabledReason?: string;
  /** Stable callbacks taking the item, so the card can be memoized. */
  onToggleCheck: (item: SourceTypeLogsDrilldownItem) => void;
  onRun: (itemId: string) => void;
  /** Stops the card's run (a source that requires an explicit run). */
  onStop?: (itemId: string) => void;
  onVisibilityChange: (itemId: string, visible: boolean) => void;
  onBrushTime: (from: number, to: number) => void;
}

/**
 * A registered source's item on the Explore logs page: its name and free details, then (once run)
 * a histogram and the latest events, like an OpenSearch index card. On a source that requires an
 * explicit run, nothing is queried until the user presses Run. An item the source marks
 * `unavailable` shows why instead, with no Run button, and can't be newly ticked.
 */
const SourceItemCardComponent: React.FC<Props> = ({
  services,
  item,
  icon,
  hasHistogram,
  explicitRun,
  result,
  error,
  loading,
  stale,
  checked,
  checkDisabledReason,
  onToggleCheck,
  onRun,
  onStop,
  onVisibilityChange,
  onBrushTime,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Visibility drives automatic runs on sources that don't require an explicit one.
  const visibilityRef = useRef(onVisibilityChange);
  visibilityRef.current = onVisibilityChange;
  const itemId = item.id;
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => visibilityRef.current(itemId, entry.isIntersecting)),
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      visibilityRef.current(itemId, false);
    };
  }, [itemId]);
  const run = () => onRun(itemId);
  const unavailable = item.unavailable;
  // An unavailable item can't be newly ticked; one already ticked can still be unticked.
  const uncheckableReason = unavailable ? unavailable.title : checkDisabledReason;
  const checkDisabled = !checked && !!uncheckableReason;
  const reasonId = `logsDrilldownSourceCardReason-${itemId}`;

  const details = (item.details ?? [])
    .filter((detail) => detail.value)
    .map((detail) => `${detail.label}: ${detail.value}`)
    .join(' · ');

  const runLabel = result
    ? i18n.translate('explore.logsDrilldown.source.runAgain', { defaultMessage: 'Run again' })
    : i18n.translate('explore.logsDrilldown.source.run', { defaultMessage: 'Run' });

  // While a card runs (or waits its turn), its button stops it: on a source with billed queries,
  // that's the way to cancel a long run without leaving the scope.
  const runButton =
    explicitRun && loading && onStop ? (
      <EuiFlexItem grow={false}>
        <EuiButton
          size="s"
          iconType="stop"
          color="danger"
          onClick={() => onStop(itemId)}
          aria-label={i18n.translate('explore.logsDrilldown.source.stopAria', {
            defaultMessage: 'Stop {name}',
            values: { name: item.name },
          })}
          data-test-subj={`logsDrilldownSourceCardStop-${item.id}`}
        >
          {i18n.translate('explore.logsDrilldown.source.stop', { defaultMessage: 'Stop' })}
        </EuiButton>
      </EuiFlexItem>
    ) : (
      explicitRun && (
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            iconType="play"
            onClick={run}
            isLoading={loading}
            isDisabled={loading}
            fill={!result || stale}
            aria-label={
              result
                ? i18n.translate('explore.logsDrilldown.source.runAgainAria', {
                    defaultMessage: 'Run {name} again',
                    values: { name: item.name },
                  })
                : i18n.translate('explore.logsDrilldown.source.runAria', {
                    defaultMessage: 'Run {name}',
                    values: { name: item.name },
                  })
            }
            data-test-subj={`logsDrilldownSourceCardRun-${item.id}`}
          >
            {runLabel}
          </EuiButton>
        </EuiFlexItem>
      )
    );

  const header = (
    <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap={false}>
      <EuiFlexItem grow={false}>
        {/* A full selection disables the unticked boxes; the reason is in a tooltip, and read
            out with the box (aria-describedby), not only in a title. */}
        <EuiToolTip content={checkDisabled ? uncheckableReason : undefined}>
          <EuiCheckbox
            id={`logsDrilldownSourceCardCheckbox-${item.id}`}
            checked={checked}
            disabled={checkDisabled}
            onChange={() => onToggleCheck(item)}
            aria-label={i18n.translate('explore.logsDrilldown.source.select', {
              defaultMessage: 'Select {name}',
              values: { name: item.name },
            })}
            aria-describedby={checkDisabled ? reasonId : undefined}
            data-test-subj={`logsDrilldownSourceCardCheckbox-${item.id}`}
          />
        </EuiToolTip>
        {checkDisabled && (
          <EuiScreenReaderOnly>
            <span id={reasonId}>{uncheckableReason}</span>
          </EuiScreenReaderOnly>
        )}
      </EuiFlexItem>
      {icon && (
        <EuiFlexItem grow={false}>
          <EuiIcon type={icon} size="s" />
        </EuiFlexItem>
      )}
      <EuiFlexItem style={{ minWidth: 0 }}>
        <EuiText size="s" className="logStreamCard__name">
          <strong>{item.name}</strong>
        </EuiText>
      </EuiFlexItem>
      {details && (
        <EuiFlexItem grow={false}>
          <EuiText size="xs">
            <EuiTextColor
              color="subdued"
              data-test-subj={`logsDrilldownSourceCardDetails-${item.id}`}
            >
              {details}
            </EuiTextColor>
          </EuiText>
        </EuiFlexItem>
      )}
      {!unavailable && runButton}
    </EuiFlexGroup>
  );

  let body: React.ReactNode;
  if (unavailable) {
    body = (
      <EuiCallOut
        size="s"
        color="warning"
        iconType="alert"
        title={unavailable.title}
        data-test-subj={`logsDrilldownSourceCardUnavailable-${item.id}`}
      >
        {unavailable.reason && <p>{unavailable.reason}</p>}
      </EuiCallOut>
    );
  } else if (error) {
    body = (
      <EuiCallOut
        size="s"
        color="danger"
        iconType="alert"
        title={error}
        data-test-subj={`logsDrilldownSourceCardError-${item.id}`}
      >
        {!explicitRun && (
          <EuiButtonEmpty size="xs" onClick={run}>
            {i18n.translate('explore.logsDrilldown.source.retry', { defaultMessage: 'Retry' })}
          </EuiButtonEmpty>
        )}
      </EuiCallOut>
    );
  } else if (!result && !loading) {
    body = explicitRun ? (
      <EuiText size="xs" color="subdued" data-test-subj={`logsDrilldownSourceCardIdle-${item.id}`}>
        {i18n.translate('explore.logsDrilldown.source.idle', {
          defaultMessage: 'Not run yet. Press Run to query it for the selected time range.',
        })}
      </EuiText>
    ) : null;
  } else {
    const rows = result?.preview.rows ?? [];
    const logs = (
      <div
        className="logStreamCard__logs"
        style={{ maxHeight: LOGS_MAX_HEIGHT }}
        data-test-subj={`logsDrilldownSourceCardLogs-${item.id}`}
      >
        {!result ? (
          <LogLinesSkeleton />
        ) : rows.length === 0 ? (
          <EuiText size="xs" color="subdued" className="logStreamCard__empty">
            {i18n.translate('explore.logsDrilldown.source.noEvents', {
              defaultMessage: 'No events in the selected time range.',
            })}
          </EuiText>
        ) : (
          rows.map((row, i) => (
            <LogLine
              key={i}
              row={row}
              timeFieldName={item.timeFieldName}
              severityField={item.severityField}
              truncated
            />
          ))
        )}
      </div>
    );
    const histogram = hasHistogram && (
      <EuiFlexItem
        grow={false}
        className="logStreamCard__histCol"
        style={{ flex: '0 0 360px', maxWidth: 360, minWidth: 0 }}
      >
        {result?.histogram ? (
          <SeverityHistogram
            services={services}
            histogram={result.histogram}
            onBrush={onBrushTime}
            chartId={`source-${item.id}`}
          />
        ) : !result ? (
          <CardSkeleton height={HIST_HEIGHT} />
        ) : (
          <div className="logStreamCard__histEmpty" style={{ height: HIST_HEIGHT }}>
            <EuiText size="xs" color="subdued" title={result.histogramError}>
              {i18n.translate('explore.logsDrilldown.rows.histError', {
                defaultMessage: 'Histogram unavailable',
              })}
            </EuiText>
          </div>
        )}
      </EuiFlexItem>
    );
    body = (
      <>
        {stale && result && (
          <EuiText
            size="xs"
            color="subdued"
            data-test-subj={`logsDrilldownSourceCardStale-${item.id}`}
          >
            {i18n.translate('explore.logsDrilldown.source.stale', {
              defaultMessage:
                'The time range changed or the page was refreshed since this ran. Run it again to update it.',
            })}
          </EuiText>
        )}
        {hasHistogram ? (
          <EuiFlexGroup
            gutterSize="m"
            responsive={false}
            wrap={false}
            alignItems="stretch"
            className="logStreamCard__split"
          >
            {histogram}
            <EuiFlexItem grow={true} className="logStreamCard__logCol">
              {logs}
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          logs
        )}
      </>
    );
  }

  return (
    <div
      ref={cardRef}
      className="logStreamCard"
      data-test-subj={`logsDrilldownSourceCard-${item.id}`}
    >
      <EuiPanel hasBorder paddingSize="s" hasShadow={false} className="logStreamCard__panel">
        {header}
        {body && <div className="logStreamCard__body">{body}</div>}
      </EuiPanel>
    </div>
  );
};

/** Memoized: the page re-renders on every result batch, a card only when its own props change. */
export const SourceItemCard = React.memo(SourceItemCardComponent);
