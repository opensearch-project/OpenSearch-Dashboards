/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './table_actions_popover_button.scss';

import { useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectExpandAllJson,
  selectHideEmptyFields,
  selectShowJsonFormat,
  selectWrapCellText,
} from '../../../../application/utils/state_management/selectors';
import {
  setExpandAllJson,
  setHideEmptyFields,
  setShowJsonFormat,
  setWrapCellText,
} from '../../../../application/utils/state_management/slices';
import { isOnTracesPage } from '../../../data_table/table_cell/trace_utils/trace_utils';

/**
 * Overflow menu for the settings that change how the results table renders.
 */
export const TableActionsPopoverButton = () => {
  const dispatch = useDispatch();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const wrapCellText = useSelector(selectWrapCellText);
  const hideEmptyFields = useSelector(selectHideEmptyFields);
  const showJsonFormat = useSelector(selectShowJsonFormat);
  const expandAllJson = useSelector(selectExpandAllJson);
  // Trace cells never draw a JSON tree, so the JSON switches would do nothing there.
  const showJsonSettings = !isOnTracesPage();

  const buttonLabel = i18n.translate('explore.discover.tableActions.buttonLabel', {
    defaultMessage: 'Table settings',
  });

  return (
    <EuiPopover
      button={
        // Icon-only with a hover tooltip carrying the name (Variant A, UXSO #3).
        <EuiToolTip content={buttonLabel} delay="long">
          <EuiButtonIcon
            size="s"
            iconType="controlsHorizontal"
            color="text"
            aria-label={buttonLabel}
            onClick={() => setIsPopoverOpen((isOpen) => !isOpen)}
            data-test-subj="exploreTableActionsButton"
          />
        </EuiToolTip>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      anchorPosition="downRight"
      panelPaddingSize="s"
      // Focus the Hide empty fields switch, so opening the menu does not focus its info icon and pop
      // its tooltip.
      initialFocus='[data-test-subj="exploreHideEmptyFieldsSwitch"]'
    >
      <EuiPopoverTitle>
        {i18n.translate('explore.discover.tableActions.title', {
          defaultMessage: 'Table settings',
        })}
      </EuiPopoverTitle>
      {/* Label on the left, toggle on the right: the switch's own label is hidden so the row can
          be laid out as a settings list rather than a control followed by text. */}
      <EuiFlexGroup
        alignItems="center"
        gutterSize="m"
        justifyContent="spaceBetween"
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiText size="s">
            {i18n.translate('explore.discover.hideEmptyFields', {
              defaultMessage: 'Hide empty fields',
            })}{' '}
            <EuiIconTip
              type="iInCircle"
              size="s"
              aria-label={i18n.translate('explore.discover.hideEmptyFieldsInfoAriaLabel', {
                defaultMessage: 'About hide empty fields',
              })}
              content={i18n.translate('explore.discover.hideEmptyFieldsInfo', {
                defaultMessage:
                  'Hides fields with no value in expanded rows, and columns that are empty for every result',
              })}
              iconProps={{
                // @ts-expect-error TS2353 iconProps is typed as Omit<unknown, 'type'> in this EUI version
                'data-test-subj': 'exploreHideEmptyFieldsInfo',
              }}
            />
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSwitch
            showLabel={false}
            label={i18n.translate('explore.discover.hideEmptyFields', {
              defaultMessage: 'Hide empty fields',
            })}
            checked={hideEmptyFields ?? false}
            onChange={(e) => dispatch(setHideEmptyFields(e.target.checked))}
            data-test-subj="exploreHideEmptyFieldsSwitch"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <EuiFlexGroup
        alignItems="center"
        gutterSize="m"
        justifyContent="spaceBetween"
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiText size="s">
            {i18n.translate('explore.discover.wrapCellText', {
              defaultMessage: 'Wrap cell text',
            })}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSwitch
            showLabel={false}
            label={i18n.translate('explore.discover.wrapCellText', {
              defaultMessage: 'Wrap cell text',
            })}
            checked={wrapCellText ?? false}
            onChange={(e) => dispatch(setWrapCellText(e.target.checked))}
            data-test-subj="exploreWrapCellTextSwitch"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {showJsonSettings && (
        <>
          <EuiSpacer size="s" />
          <EuiFlexGroup
            alignItems="center"
            gutterSize="m"
            justifyContent="spaceBetween"
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                {i18n.translate('explore.discover.showJsonFormat', {
                  defaultMessage: 'Show as JSON format',
                })}{' '}
                <EuiIconTip
                  type="iInCircle"
                  size="s"
                  aria-label={i18n.translate('explore.discover.showJsonFormatInfoAriaLabel', {
                    defaultMessage: 'About show as JSON format',
                  })}
                  content={i18n.translate('explore.discover.showJsonFormatInfo', {
                    defaultMessage:
                      'Shows string values that hold JSON as a collapsible tree, in the table and in expanded documents',
                  })}
                  iconProps={{
                    // @ts-expect-error TS2353 iconProps is typed as Omit<unknown, 'type'> in this EUI version
                    'data-test-subj': 'exploreShowJsonFormatInfo',
                  }}
                />
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSwitch
                showLabel={false}
                label={i18n.translate('explore.discover.showJsonFormat', {
                  defaultMessage: 'Show as JSON format',
                })}
                checked={showJsonFormat}
                onChange={(e) => dispatch(setShowJsonFormat(e.target.checked))}
                data-test-subj="exploreShowJsonFormatSwitch"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <EuiFlexGroup
            alignItems="center"
            gutterSize="m"
            justifyContent="spaceBetween"
            responsive={false}
            className="exploreTableActions__subSetting"
          >
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color={showJsonFormat ? 'default' : 'subdued'}>
                {i18n.translate('explore.discover.expandAllJson', {
                  defaultMessage: 'Expand all',
                })}{' '}
                <EuiIconTip
                  type="iInCircle"
                  size="s"
                  aria-label={i18n.translate('explore.discover.expandAllJsonInfoAriaLabel', {
                    defaultMessage: 'About expand all',
                  })}
                  content={i18n.translate('explore.discover.expandAllJsonInfo', {
                    defaultMessage:
                      'Opens up to 15 levels of each JSON tree. An object or array over 1,000 characters of its own starts closed',
                  })}
                  iconProps={{
                    // @ts-expect-error TS2353 iconProps is typed as Omit<unknown, 'type'> in this EUI version
                    'data-test-subj': 'exploreExpandAllJsonInfo',
                  }}
                />
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSwitch
                compressed
                showLabel={false}
                label={i18n.translate('explore.discover.expandAllJson', {
                  defaultMessage: 'Expand all',
                })}
                checked={expandAllJson}
                disabled={!showJsonFormat}
                onChange={(e) => dispatch(setExpandAllJson(e.target.checked))}
                data-test-subj="exploreExpandAllJsonSwitch"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </EuiPopover>
  );
};
