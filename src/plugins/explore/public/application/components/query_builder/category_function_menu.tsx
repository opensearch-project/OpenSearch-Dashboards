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

export interface FunctionDef {
  id: string;
  name: string;
  params: string[];
  paramNames?: string[];
  description: string;
}

export interface FunctionCategory {
  name: string;
  items: FunctionDef[];
}

export interface RootMenuItem {
  name: string;
  onClick: () => void;
  description?: string;
  dataTestSubj?: string;
}

interface CategoryFunctionMenuProps {
  categories: FunctionCategory[];
  onSelect: (item: FunctionDef) => void;
  trigger:
    | { kind: 'empty'; label: string; iconType?: string; className?: string }
    | {
        kind: 'icon';
        iconType: string;
        ariaLabel: string;
        color?: EuiButtonIconColor;
        className?: string;
      };
  rootTitle?: string;
  extraRootItems?: RootMenuItem[];
  anchorPosition?: EuiPopoverProps['anchorPosition'];
  panelClassName?: string;
  dataTestSubj?: string;
}

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
            'data-test-subj': item.dataTestSubj,
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
