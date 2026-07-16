/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './category_function_menu.scss';

import React, { useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiButtonIconColor,
  EuiContextMenu,
  EuiPopover,
  EuiPopoverProps,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';

/**
 * One selectable function/operation in a builder menu. Shared shape across the
 * logs PPL scalar functions and metrics PromQL operations: both carry an id, a
 * display name, default extra params, optional per-param placeholder labels, and
 * a description shown under the name in the menu.
 */
export interface FunctionDef {
  id: string;
  name: string;
  params: string[];
  paramNames?: string[];
  description: string;
}

/** A drill-in category of functions in the menu's root list. */
export interface FunctionCategory {
  name: string;
  items: FunctionDef[];
}

/** A menu item shown in the root panel, ahead of any categories. */
export interface RootMenuItem {
  name: string;
  onClick: () => void;
  /** Optional description, rendered under the name like a category item. */
  description?: string;
}

interface CategoryFunctionMenuProps {
  /** Categories drilled into from the root panel; each item is selectable. */
  categories: FunctionCategory[];
  /** Called with the chosen function when a category item is picked. */
  onSelect: (item: FunctionDef) => void;
  /** Trigger button — an "empty" text button or a compact icon button. */
  trigger:
    | { kind: 'empty'; label: string; iconType?: string; className?: string }
    | {
        kind: 'icon';
        iconType: string;
        ariaLabel: string;
        color?: EuiButtonIconColor;
        /** Extra class on the icon button (e.g. to box it within a builder row). */
        className?: string;
      };
  /** Optional title for the root panel. */
  rootTitle?: string;
  /** Optional plain items rendered above the categories in the root panel. */
  extraRootItems?: RootMenuItem[];
  anchorPosition?: EuiPopoverProps['anchorPosition'];
  /** Extra class on the popover panel (e.g. to cap its height and scroll). */
  panelClassName?: string;
  dataTestSubj?: string;
}

/**
 * Presentational category-drilling menu shared by the query builders: an
 * EuiPopover + EuiContextMenu whose root lists categories (plus any extra plain
 * items), each drilling into a panel of functions rendered as a bold name over a
 * subdued description. Selecting a function calls `onSelect` and closes the menu.
 */
/** Render a menu item's label as a bold name over a subdued description. */
const itemLabel = (name: React.ReactNode, description?: string) =>
  description ? (
    <div>
      <strong>{name}</strong>
      <EuiText size="xs" color="subdued" className="cfmMenuDescription">
        {description}
      </EuiText>
    </div>
  ) : (
    name
  );

export const CategoryFunctionMenu: React.FC<CategoryFunctionMenuProps> = ({
  categories,
  onSelect,
  trigger,
  rootTitle,
  extraRootItems,
  anchorPosition = 'downLeft',
  panelClassName,
  dataTestSubj,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const panels = useMemo(
    () => [
      {
        id: 0,
        title: rootTitle,
        items: [
          ...(extraRootItems ?? []).map((item) => ({
            name: itemLabel(item.name, item.description),
            onClick: () => {
              item.onClick();
              setIsOpen(false);
            },
          })),
          ...categories.map((cat, i) => ({ name: cat.name, panel: i + 1 })),
        ],
      },
      ...categories.map((cat, i) => ({
        id: i + 1,
        title: cat.name,
        items: cat.items.map((item) => ({
          name: itemLabel(item.name, item.description),
          onClick: () => {
            onSelect(item);
            setIsOpen(false);
          },
        })),
      })),
    ],
    [categories, extraRootItems, rootTitle, onSelect]
  );

  let button: React.ReactNode;
  if (trigger.kind === 'empty') {
    button = (
      <EuiButtonEmpty
        size="xs"
        iconType={trigger.iconType}
        className={trigger.className}
        onClick={() => setIsOpen(!isOpen)}
        data-test-subj={dataTestSubj}
      >
        {trigger.label}
      </EuiButtonEmpty>
    );
  } else {
    // Icon trigger: the aria-label doubles as the hover tooltip so a compact
    // icon-only affordance still explains what it does.
    button = (
      <EuiToolTip content={trigger.ariaLabel} position="top">
        <EuiButtonIcon
          className={trigger.className}
          iconType={trigger.iconType}
          color={trigger.color}
          size="s"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={trigger.ariaLabel}
          data-test-subj={dataTestSubj}
        />
      </EuiToolTip>
    );
  }

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
      panelClassName={panelClassName}
      anchorPosition={anchorPosition}
    >
      <EuiContextMenu initialPanelId={0} panels={panels} size="s" />
    </EuiPopover>
  );
};
