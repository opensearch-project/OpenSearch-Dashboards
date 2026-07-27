/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import { EuiButtonEmpty, EuiButtonIcon } from '@elastic/eui';

interface ControlGroupProps {
  label?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  dataTestSubj?: string;
  children: React.ReactNode;
}

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
  ariaLabel: string;
  variant?: 'default' | 'chip';
  dataTestSubj?: string;
}

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
  iconType?: string;
  dataTestSubj?: string;
}

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

interface FieldPillProps {
  label: string;
  onRemove: () => void;
  removeAriaLabel: string;
  dataTestSubj?: string;
}

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
