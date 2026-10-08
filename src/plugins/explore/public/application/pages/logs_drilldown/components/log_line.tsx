/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import { PreviewRow } from '../hooks/fetch_preview';
import { SEVERITY_FIELD_CANDIDATES, normalizeSeverity, severityColor } from '../severity';

interface Props {
  row: PreviewRow;
  timeFieldName?: string;
  /** Field to read the level token from (detected once by the card). */
  severityField?: string;
  /** Truncated = one line with ellipsis; expanded = wrap + full. */
  truncated?: boolean;
}

/**
 * Renders one raw log line, Grafana-style: a subdued timestamp, a color-coded level chip (green
 * info / yellow warn / red error), then the rest of the record as `key=value` pairs (or JSON when
 * there's no obvious structure). Not a parsed column table — the whole line is the unit.
 */
export const LogLine: React.FC<Props> = ({
  row,
  timeFieldName,
  severityField,
  truncated = true,
}) => {
  const levelFieldName =
    severityField ?? SEVERITY_FIELD_CANDIDATES.find((f) => row[f] !== undefined);
  const levelValue = levelFieldName ? row[levelFieldName] : undefined;
  const levelBucket = normalizeSeverity(levelValue);

  const tsValue = timeFieldName ? row[timeFieldName] : undefined;

  // Remaining fields = everything except the time and level fields, rendered as key=value with the
  // key names dimmed (Grafana texture). Falls back to JSON when there's a single opaque body field.
  const restEntries = Object.entries(row).filter(
    ([k]) => k !== timeFieldName && k !== levelFieldName
  );

  return (
    <div
      className={classNames('logsExploreLogLine', {
        'logsExploreLogLine--truncated': truncated,
      })}
      data-test-subj="logsExploreLogLine"
    >
      {tsValue !== undefined && <span className="logsExploreLogLine__ts">{formatTs(tsValue)}</span>}
      {levelValue != null && String(levelValue).trim() !== '' && (
        <span
          className="logsExploreLogLine__level"
          style={{ color: severityColor(levelBucket) }}
          data-test-subj={`logsExploreLogLine-level-${levelBucket}`}
        >
          {String(levelValue).toUpperCase()}
        </span>
      )}
      <span className="logsExploreLogLine__body">
        {restEntries.length > 0
          ? restEntries.map(([k, v], i) => (
              <React.Fragment key={k}>
                {i > 0 && ' '}
                <b>{k}=</b>
                {formatValue(v)}
              </React.Fragment>
            ))
          : safeStringify(row)}
      </span>
    </div>
  );
};

/** Shorten ISO timestamps to a scannable HH:MM:SS.mmm (drops the date + trailing Z). */
function formatTs(v: unknown): string {
  const s = String(v);
  const m = s.match(/T(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)/);
  return m ? m[1] : s;
}

function formatValue(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') return safeStringify(v);
  return String(v);
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
