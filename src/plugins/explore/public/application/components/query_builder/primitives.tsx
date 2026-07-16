/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import { EuiButtonEmpty, EuiButtonIcon } from '@elastic/eui';

/**
 * Generic presentational primitives shared by the explore query builders (the
 * logs PPL builder and the metrics PromQL builder). These wrap the `plq*` design
 * system classes (see query_builder.scss) so the markup — the floating-label
 * group box, the unified remove ✕, the separator, the ghost "add" button, and the
 * simple field pill — lives in one place instead of being hand-written (and
 * drifting) in each builder.
 *
 * These are deliberately the *boring, duplicated* pieces only. Language-specific
 * composition (aggregation rows, operation pills, label filters), the rich chips
 * (scalar-function chip, the "every <interval>" span chip), and the
 * CategoryFunctionMenu-driven icon triggers stay in their own builders.
 *
 * Every primitive forwards `data-test-subj` / `aria-label` / children so the
 * builders' existing tests (which query by data-test-subj, text, and role — never
 * by class) keep working unchanged.
 */

interface ControlGroupProps {
  /** Floating label rendered on the group's top border; omit for a label-less group. */
  label?: React.ReactNode;
  /** Extra classes appended after `plqGroup` (e.g. metric-combo right padding). */
  className?: string;
  style?: React.CSSProperties;
  dataTestSubj?: string;
  children: React.ReactNode;
}

/**
 * The floating-label control box: a bordered, flat-radius group whose label
 * straddles the top border. The inner EUI controls (combobox / super-select /
 * field) are neutralized to bare controls by the `.plqGroup` descendant rules in
 * query_builder.scss, so this must keep emitting the literal `plqGroup` class.
 */
export const ControlGroup: React.FC<ControlGroupProps> = ({
  label,
  className,
  style,
  dataTestSubj,
  children,
}) => (
  <div className={classNames('plqGroup', className)} style={style} data-test-subj={dataTestSubj}>
    {label != null && <span className="plqGroup__label">{label}</span>}
    {children}
  </div>
);

interface RemoveButtonProps {
  onClick: () => void;
  /** Required — every remove ✕ in the builders carries an aria-label today. */
  ariaLabel: string;
  /**
   * `default` → the standalone 16px ✕ (`.plqX`). `chip` → the smaller 12px ✕
   * (`.plqPillX`) that sits inside a pill/chip.
   */
  variant?: 'default' | 'chip';
  dataTestSubj?: string;
}

/**
 * The unified remove ✕. One style for every removable thing in the builders — the
 * anti-drift point: a metrics button can no longer forget the flat-radius class.
 */
export const RemoveButton: React.FC<RemoveButtonProps> = ({
  onClick,
  ariaLabel,
  variant = 'default',
  dataTestSubj,
}) => (
  <EuiButtonIcon
    className={variant === 'chip' ? 'plqPillX' : 'plqX'}
    iconType="cross"
    color="text"
    size="s"
    aria-label={ariaLabel}
    onClick={onClick}
    data-test-subj={dataTestSubj}
  />
);

interface GhostAddButtonProps {
  label: string;
  onClick: () => void;
  /** Leading icon; defaults to `plus`. */
  iconType?: string;
  dataTestSubj?: string;
}

/**
 * The dashed "Add …" affordance used for empty-state controls (the sort row's
 * "Add sort", the logs "Add metric" empty trigger). Not for the icon-only ghost
 * triggers that go through CategoryFunctionMenu — those pass a class string.
 */
export const GhostAddButton: React.FC<GhostAddButtonProps> = ({
  label,
  onClick,
  iconType = 'plus',
  dataTestSubj,
}) => (
  <EuiButtonEmpty
    size="xs"
    iconType={iconType}
    className="plqGhostAdd"
    onClick={onClick}
    data-test-subj={dataTestSubj}
  >
    {label}
  </EuiButtonEmpty>
);

/** A thin vertical separator between inner controls of a group. */
export const Separator: React.FC = () => <div className="plqSep" />;

interface FieldPillProps {
  /** Field name, rendered as flat monospace text. */
  label: string;
  onRemove: () => void;
  removeAriaLabel: string;
  dataTestSubj?: string;
}

/**
 * The simple group-by field pill: a flat neutral chip with the field name and its
 * own chip-sized ✕. Only the *simple* pill — the scalar-function chip and the
 * "every <interval>" span chip are richer and stay in the logs builder.
 */
export const FieldPill: React.FC<FieldPillProps> = ({
  label,
  onRemove,
  removeAriaLabel,
  dataTestSubj,
}) => (
  <span className="plqPill" data-test-subj={dataTestSubj}>
    <span className="plqPill__label">{label}</span>
    <RemoveButton variant="chip" onClick={onRemove} ariaLabel={removeAriaLabel} />
  </span>
);
