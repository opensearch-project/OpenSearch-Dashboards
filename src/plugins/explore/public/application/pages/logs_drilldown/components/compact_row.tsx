/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiTextColor,
  EuiLink,
  EuiCheckbox,
  EuiCode,
} from '@elastic/eui';

export type CompactRowTone = 'default' | 'subdued' | 'danger' | 'warning';

interface Props {
  /** EUI icon type for the leading kind glyph. */
  icon: string;
  /** Index / dataset name. */
  name: string;
  /** When provided, the name renders as a link that runs this action; otherwise it's muted text. */
  nameOnClick?: () => void;
  /** Title/aria for the name link (e.g. "Create dataset"). */
  nameTitle?: string;
  /** The one-line status message (e.g. "No events in the last 15 minutes"). */
  message: string;
  /** Optional trailing meta (e.g. "0 docs · created 3 days ago"). */
  meta?: string;
  /** Row tone — drives border/background tint. */
  tone?: CompactRowTone;
  /** Optional error string rendered as a monospace chip (state 04). */
  errorText?: string;
  /** Optional trailing action node (e.g. a Retry link). */
  action?: React.ReactNode;
  /** Optional selection checkbox (indexes only; omitted for empty/no-time rows). */
  checkbox?: { checked: boolean; onChange: () => void; ariaLabel: string; id: string };
  'data-test-subj'?: string;
}

/**
 * The compact one-row treatment shared by the empty / no-recent-data / error states and the
 * collapsed "no recent data" drawer rows. A single horizontal line — kind icon, name (link or
 * muted), status message + optional meta/error chip, and an optional trailing action — inside a
 * bordered panel, replacing the full 132px histogram+logs card for rows that carry nothing to scan.
 */
export const CompactRow: React.FC<Props> = ({
  icon,
  name,
  nameOnClick,
  nameTitle,
  message,
  meta,
  tone = 'default',
  errorText,
  action,
  checkbox,
  'data-test-subj': dataTestSubj,
}) => {
  return (
    <EuiPanel
      hasBorder
      paddingSize="none"
      hasShadow={false}
      className={classNames('logsDrilldownCompactRow', `logsDrilldownCompactRow--${tone}`)}
      data-test-subj={dataTestSubj}
    >
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap={false}>
        {checkbox && (
          <EuiFlexItem grow={false}>
            <EuiCheckbox
              id={checkbox.id}
              checked={checkbox.checked}
              onChange={checkbox.onChange}
              aria-label={checkbox.ariaLabel}
            />
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiIcon type={icon} size="s" color={tone === 'default' ? undefined : 'subdued'} />
        </EuiFlexItem>
        <EuiFlexItem grow={false} className="logsDrilldownCompactRow__name">
          <EuiText size="s">
            {nameOnClick ? (
              <EuiLink
                onClick={nameOnClick}
                title={nameTitle}
                data-test-subj="logsExploreCardNameLink"
              >
                {name}
              </EuiLink>
            ) : (
              <EuiTextColor color="subdued">
                <strong>{name}</strong>
              </EuiTextColor>
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued">
            ·
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued">
            {message}
          </EuiText>
        </EuiFlexItem>
        {errorText && (
          <EuiFlexItem grow={false}>
            <EuiCode data-test-subj="logsExploreCardErrorChip">{errorText}</EuiCode>
          </EuiFlexItem>
        )}
        {meta && (
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued" className="logsDrilldownCompactRow__meta">
              {meta}
            </EuiText>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={true} />
        {action && <EuiFlexItem grow={false}>{action}</EuiFlexItem>}
      </EuiFlexGroup>
    </EuiPanel>
  );
};
