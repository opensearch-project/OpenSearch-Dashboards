/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

interface EuiValues {
  [key: string]: any;
}

export const getEuiContextMapping = () => {
  const euiContextMapping = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiBasicTable.selectAllRows': i18n.translate('core.euiBasicTable.selectAllRows', {
      defaultMessage: 'Select all rows',
      description: 'ARIA and displayed label on a checkbox to select all table rows',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiBasicTable.selectThisRow': i18n.translate('core.euiBasicTable.selectThisRow', {
      defaultMessage: 'Select this row',
      description: 'ARIA and displayed label on a checkbox to select a single table row',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiBasicTable.tableDescription': ({ itemCount }: EuiValues) =>
      i18n.translate('core.euiBasicTable.tableDescription', {
        defaultMessage: 'Below is a table of {itemCount} items.',
        values: { itemCount },
        description: 'Screen reader text to describe the size of a table',
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiBottomBar.screenReaderAnnouncement': i18n.translate(
      'core.euiBottomBar.screenReaderAnnouncement',
      {
        defaultMessage:
          'There is a new menu opening with page level controls at the end of the document.',
        description:
          'Screen reader announcement that functionality is available in the page document',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiBreadcrumbs.collapsedBadge.ariaLabel': i18n.translate(
      'core.euiBreadcrumbs.collapsedBadge.ariaLabel',
      {
        defaultMessage: 'Show all breadcrumbs',
        description: 'Displayed when one or more breadcrumbs are hidden.',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCardSelect.select': i18n.translate('core.euiCardSelect.select', {
      defaultMessage: 'Select',
      description: 'Displayed button text when a card option can be selected.',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCardSelect.selected': i18n.translate('core.euiCardSelect.selected', {
      defaultMessage: 'Selected',
      description: 'Displayed button text when a card option is selected.',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCardSelect.unavailable': i18n.translate('core.euiCardSelect.unavailable', {
      defaultMessage: 'Unavailable',
      description: 'Displayed button text when a card option is unavailable.',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCodeBlock.copyButton': i18n.translate('core.euiCodeBlock.copyButton', {
      defaultMessage: 'Copy',
      description: 'ARIA label for a button that copies source code text to the clipboard',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCodeEditor.startEditing': i18n.translate('core.euiCodeEditor.startEditing', {
      defaultMessage: 'Press Enter to start editing.',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCodeEditor.startInteracting': i18n.translate('core.euiCodeEditor.startInteracting', {
      defaultMessage: 'Press Enter to start interacting with the code.',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCodeEditor.stopEditing': i18n.translate('core.euiCodeEditor.stopEditing', {
      defaultMessage: "When you're done, press Escape to stop editing.",
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCodeEditor.stopInteracting': i18n.translate('core.euiCodeEditor.stopInteracting', {
      defaultMessage: "When you're done, press Escape to stop interacting with the code.",
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCollapsedItemActions.allActions': i18n.translate(
      'core.euiCollapsedItemActions.allActions',
      {
        defaultMessage: 'All actions',
        description:
          'ARIA label and tooltip content describing a button that expands an actions menu',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColorPicker.screenReaderAnnouncement': i18n.translate(
      'core.euiColorPicker.screenReaderAnnouncement',
      {
        defaultMessage:
          'A popup with a range of selectable colors opened. Tab forward to cycle through colors choices or press escape to close this popup.',
        description:
          'Message when the color picker popover is opened. Describes the interaction with the elements in the popover.',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColorPicker.swatchAriaLabel': ({ swatch }: EuiValues) =>
      i18n.translate('core.euiColorPicker.swatchAriaLabel', {
        defaultMessage: 'Select {swatch} as the color',
        values: { swatch },
        description:
          'Screen reader text to describe the action and hex value of the selectable option',
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColorStopThumb.removeLabel': i18n.translate('core.euiColorStopThumb.removeLabel', {
      defaultMessage: 'Remove this stop',
      description: 'Label accompanying a button whose action will remove the color stop',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColorStopThumb.screenReaderAnnouncement': i18n.translate(
      'core.euiColorStopThumb.screenReaderAnnouncement',
      {
        defaultMessage:
          'A popup with a color stop edit form opened. Tab forward to cycle through form controls or press escape to close this popup.',
        description:
          'Message when the color picker popover has opened for an individual color stop thumb.',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColorStops.screenReaderAnnouncement': ({ label, readOnly, disabled }: EuiValues) =>
      i18n.translate('core.euiColorStops.screenReaderAnnouncement', {
        defaultMessage:
          '{label}: {readOnly} {disabled} Color stop picker. Each stop consists of a number and corresponding color value. Use the Down and Up arrow keys to select individual stops. Press the Enter key to create a new stop.',
        values: { label, readOnly, disabled },
        description:
          'Screen reader text to describe the composite behavior of the color stops component.',
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSelector.hideAll': i18n.translate('core.euiColumnSelector.hideAll', {
      defaultMessage: 'Hide all',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSelector.selectAll': i18n.translate('core.euiColumnSelector.selectAll', {
      defaultMessage: 'Show all',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSorting.clearAll': i18n.translate('core.euiColumnSorting.clearAll', {
      defaultMessage: 'Clear sorting',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSorting.emptySorting': i18n.translate('core.euiColumnSorting.emptySorting', {
      defaultMessage: 'Currently no fields are sorted',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSorting.pickFields': i18n.translate('core.euiColumnSorting.pickFields', {
      defaultMessage: 'Pick fields to sort by',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSorting.sortFieldAriaLabel': i18n.translate(
      'core.euiColumnSorting.sortFieldAriaLabel',
      {
        defaultMessage: 'Sort by:',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSortingDraggable.activeSortLabel': i18n.translate(
      'core.euiColumnSortingDraggable.activeSortLabel',
      {
        defaultMessage: 'is sorting this data grid',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSortingDraggable.defaultSortAsc': i18n.translate(
      'core.euiColumnSortingDraggable.defaultSortAsc',
      {
        defaultMessage: 'A-Z',
        description: 'Ascending sort label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSortingDraggable.defaultSortDesc': i18n.translate(
      'core.euiColumnSortingDraggable.defaultSortDesc',
      {
        defaultMessage: 'Z-A',
        description: 'Descending sort label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSortingDraggable.removeSortLabel': i18n.translate(
      'core.euiColumnSortingDraggable.removeSortLabel',
      {
        defaultMessage: 'Remove from data grid sort:',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiColumnSortingDraggable.toggleLegend': i18n.translate(
      'core.euiColumnSortingDraggable.toggleLegend',
      {
        defaultMessage: 'Select sorting method for field:',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiComboBoxOptionsList.allOptionsSelected': i18n.translate(
      'core.euiComboBoxOptionsList.allOptionsSelected',
      {
        defaultMessage: "You've selected all available options",
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiComboBoxOptionsList.alreadyAdded': ({ label }: EuiValues) => (
      <FormattedMessage
        id="core.euiComboBoxOptionsList.alreadyAdded"
        defaultMessage="{label} has already been added"
        values={{ label }}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiComboBoxOptionsList.createCustomOption': ({ key, searchValue }: EuiValues) => (
      <FormattedMessage
        id="core.euiComboBoxOptionsList.createCustomOption"
        defaultMessage="Hit {key} to add {searchValue} as a custom option"
        values={{ key, searchValue }}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiComboBoxOptionsList.loadingOptions': i18n.translate(
      'core.euiComboBoxOptionsList.loadingOptions',
      {
        defaultMessage: 'Loading options',
        description: 'Placeholder message while data is asynchronously loaded',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiComboBoxOptionsList.noAvailableOptions': i18n.translate(
      'core.euiComboBoxOptionsList.noAvailableOptions',
      {
        defaultMessage: "There aren't any options available",
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiComboBoxOptionsList.noMatchingOptions': ({ searchValue }: EuiValues) => (
      <FormattedMessage
        id="core.euiComboBoxOptionsList.noMatchingOptions"
        defaultMessage="{searchValue} doesn't match any options"
        values={{ searchValue }}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiComboBoxPill.removeSelection': ({ children }: EuiValues) =>
      i18n.translate('core.euiComboBoxPill.removeSelection', {
        defaultMessage: 'Remove {children} from selection in this group',
        values: { children },
        description: 'ARIA label, `children` is the human-friendly value of an option',
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiCommonlyUsedTimeRanges.legend': i18n.translate('core.euiCommonlyUsedTimeRanges.legend', {
      defaultMessage: 'Commonly used',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGrid.screenReaderNotice': i18n.translate('core.euiDataGrid.screenReaderNotice', {
      defaultMessage: 'Cell contains interactive content.',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridCell.expandButtonTitle': i18n.translate('core.euiDataGridCell.expandButtonTitle', {
      defaultMessage: 'Click or hit enter to interact with cell content',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.booleanSortTextAsc': i18n.translate(
      'core.euiDataGridSchema.booleanSortTextAsc',
      {
        defaultMessage: 'True-False',
        description: 'Ascending boolean label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.booleanSortTextDesc': i18n.translate(
      'core.euiDataGridSchema.booleanSortTextDesc',
      {
        defaultMessage: 'False-True',
        description: 'Descending boolean label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.currencySortTextAsc': i18n.translate(
      'core.euiDataGridSchema.currencySortTextAsc',
      {
        defaultMessage: 'Low-High',
        description: 'Ascending currency label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.currencySortTextDesc': i18n.translate(
      'core.euiDataGridSchema.currencySortTextDesc',
      {
        defaultMessage: 'High-Low',
        description: 'Descending currency label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.dateSortTextAsc': i18n.translate('core.euiDataGridSchema.dateSortTextAsc', {
      defaultMessage: 'New-Old',
      description: 'Ascending date label',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.dateSortTextDesc': i18n.translate(
      'core.euiDataGridSchema.dateSortTextDesc',
      {
        defaultMessage: 'Old-New',
        description: 'Descending date label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.numberSortTextAsc': i18n.translate(
      'core.euiDataGridSchema.numberSortTextAsc',
      {
        defaultMessage: 'Low-High',
        description: 'Ascending number label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.numberSortTextDesc': i18n.translate(
      'core.euiDataGridSchema.numberSortTextDesc',
      {
        defaultMessage: 'High-Low',
        description: 'Descending number label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.jsonSortTextAsc': i18n.translate('core.euiDataGridSchema.jsonSortTextAsc', {
      defaultMessage: 'Small-Large',
      description: 'Ascending size label',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiDataGridSchema.jsonSortTextDesc': i18n.translate(
      'core.euiDataGridSchema.jsonSortTextDesc',
      {
        defaultMessage: 'Large-Small',
        description: 'Descending size label',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiFilterButton.filterBadge': ({ count, hasActiveFilters }: EuiValues) =>
      i18n.translate('core.euiFilterButton.filterBadge', {
        defaultMessage: '{count} {filterCountLabel} filters',
        values: { count, filterCountLabel: hasActiveFilters ? 'active' : 'available' },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiForm.addressFormErrors': i18n.translate('core.euiForm.addressFormErrors', {
      defaultMessage: 'Please address the errors in your form.',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiFormControlLayoutClearButton.label': i18n.translate(
      'core.euiFormControlLayoutClearButton.label',
      {
        defaultMessage: 'Clear input',
        description: 'ARIA label on a button that removes any entry in a form field',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiHeaderAlert.dismiss': i18n.translate('core.euiHeaderAlert.dismiss', {
      defaultMessage: 'Dismiss',
      description: 'ARIA label on a button that dismisses/removes a notification',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiHeaderLinks.appNavigation': i18n.translate('core.euiHeaderLinks.appNavigation', {
      defaultMessage: 'App navigation',
      description: 'ARIA label on a `nav` element',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiHeaderLinks.openNavigationMenu': i18n.translate('core.euiHeaderLinks.openNavigationMenu', {
      defaultMessage: 'Open navigation menu',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiHue.label': i18n.translate('core.euiHue.label', {
      defaultMessage: 'Select the HSV color mode "hue" value',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiImage.closeImage': ({ alt }: EuiValues) =>
      i18n.translate('core.euiImage.closeImage', {
        defaultMessage: 'Close full screen {alt} image',
        values: { alt },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiImage.openImage': ({ alt }: EuiValues) =>
      i18n.translate('core.euiImage.openImage', {
        defaultMessage: 'Open full screen {alt} image',
        values: { alt },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiLink.external.ariaLabel': i18n.translate('core.euiLink.external.ariaLabel', {
      defaultMessage: 'External link',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiModal.closeModal': i18n.translate('core.euiModal.closeModal', {
      defaultMessage: 'Closes this modal window',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiPagination.jumpToLastPage': ({ pageCount }: EuiValues) =>
      i18n.translate('core.euiPagination.jumpToLastPage', {
        defaultMessage: 'Jump to the last page, number {pageCount}',
        values: { pageCount },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiPagination.nextPage': i18n.translate('core.euiPagination.nextPage', {
      defaultMessage: 'Next page',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiPagination.pageOfTotal': ({ page, total }: EuiValues) =>
      i18n.translate('core.euiPagination.pageOfTotal', {
        defaultMessage: 'Page {page} of {total}',
        values: { page, total },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiPagination.previousPage': i18n.translate('core.euiPagination.previousPage', {
      defaultMessage: 'Previous page',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiPopover.screenReaderAnnouncement': i18n.translate(
      'core.euiPopover.screenReaderAnnouncement',
      {
        defaultMessage: 'You are in a dialog. To close this dialog, hit escape.',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.applyButton': i18n.translate('core.euiQuickSelect.applyButton', {
      defaultMessage: 'Apply',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.fullDescription': ({ timeTense, timeValue, timeUnit }: EuiValues) =>
      i18n.translate('core.euiQuickSelect.fullDescription', {
        defaultMessage: 'Currently set to {timeTense} {timeValue} {timeUnit}.',
        values: { timeTense, timeValue, timeUnit },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.legendText': i18n.translate('core.euiQuickSelect.legendText', {
      defaultMessage: 'Quick select a time range',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.nextLabel': i18n.translate('core.euiQuickSelect.nextLabel', {
      defaultMessage: 'Next time window',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.previousLabel': i18n.translate('core.euiQuickSelect.previousLabel', {
      defaultMessage: 'Previous time window',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.quickSelectTitle': i18n.translate('core.euiQuickSelect.quickSelectTitle', {
      defaultMessage: 'Quick select',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.tenseLabel': i18n.translate('core.euiQuickSelect.tenseLabel', {
      defaultMessage: 'Time tense',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.unitLabel': i18n.translate('core.euiQuickSelect.unitLabel', {
      defaultMessage: 'Time unit',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiQuickSelect.valueLabel': i18n.translate('core.euiQuickSelect.valueLabel', {
      defaultMessage: 'Time value',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRefreshInterval.fullDescription': ({ optionValue, optionText }: EuiValues) =>
      i18n.translate('core.euiRefreshInterval.fullDescription', {
        defaultMessage: 'Currently set to {optionValue} {optionText}.',
        values: { optionValue, optionText },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRefreshInterval.legend': i18n.translate('core.euiRefreshInterval.legend', {
      defaultMessage: 'Refresh every',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRefreshInterval.start': i18n.translate('core.euiRefreshInterval.start', {
      defaultMessage: 'Start',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRefreshInterval.stop': i18n.translate('core.euiRefreshInterval.stop', {
      defaultMessage: 'Stop',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRelativeTab.fullDescription': ({ unit }: EuiValues) =>
      i18n.translate('core.euiRelativeTab.fullDescription', {
        defaultMessage: 'The unit is changeable. Currently set to {unit}.',
        values: { unit },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRelativeTab.relativeDate': ({ position }: EuiValues) =>
      i18n.translate('core.euiRelativeTab.relativeDate', {
        defaultMessage: '{position} date',
        values: { position },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRelativeTab.roundingLabel': ({ unit }: EuiValues) =>
      i18n.translate('core.euiRelativeTab.roundingLabel', {
        defaultMessage: 'Round to the {unit}',
        values: { unit },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiRelativeTab.unitInputLabel': i18n.translate('core.euiRelativeTab.unitInputLabel', {
      defaultMessage: 'Relative time span',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSaturation.roleDescription': i18n.translate('core.euiSaturation.roleDescription', {
      defaultMessage: 'HSV color mode saturation and value selection',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSaturation.screenReaderAnnouncement': i18n.translate(
      'core.euiSaturation.screenReaderAnnouncement',
      {
        defaultMessage:
          'Use the arrow keys to navigate the square color gradient. The coordinates resulting from each key press will be used to calculate HSV color mode "saturation" and "value" numbers, in the range of 0 to 1. Left and right decrease and increase (respectively) the "saturation" value. Up and down decrease and increase (respectively) the "value" value.',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSelectable.loadingOptions': i18n.translate('core.euiSelectable.loadingOptions', {
      defaultMessage: 'Loading options',
      description: 'Placeholder message while data is asynchronously loaded',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSelectable.noAvailableOptions': i18n.translate('core.euiSelectable.noAvailableOptions', {
      defaultMessage: "There aren't any options available",
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSelectable.noMatchingOptions': ({ searchValue }: EuiValues) => (
      <FormattedMessage
        id="core.euiSelectable.noMatchingOptions"
        defaultMessage="{searchValue} doesn't match any options"
        values={{ searchValue }}
      />
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStat.loadingText': i18n.translate('core.euiStat.loadingText', {
      defaultMessage: 'Statistic is loading',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStep.ariaLabel': ({ status }: EuiValues) =>
      i18n.translate('core.euiStep.ariaLabel', {
        defaultMessage: '{stepStatus}',
        values: { stepStatus: status === 'incomplete' ? 'Incomplete Step' : 'Step' },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStepHorizontal.buttonTitle': ({ step, title, disabled, isComplete }: EuiValues) => {
      return i18n.translate('core.euiStepHorizontal.buttonTitle', {
        defaultMessage: 'Step {step}: {title}{titleAppendix}',
        values: {
          step,
          title,
          titleAppendix: disabled ? ' is disabled' : isComplete ? ' is complete' : '',
        },
      });
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStepHorizontal.step': i18n.translate('core.euiStepHorizontal.step', {
      defaultMessage: 'Step',
      description: 'Screen reader text announcing information about a step in some process',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStepNumber.hasErrors': i18n.translate('core.euiStepNumber.hasErrors', {
      defaultMessage: 'has errors',
      description:
        'Used as the title attribute on an image or svg icon to indicate a given process step has errors',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStepNumber.hasWarnings': i18n.translate('core.euiStepNumber.hasWarnings', {
      defaultMessage: 'has warnings',
      description:
        'Used as the title attribute on an image or svg icon to indicate a given process step has warnings',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStepNumber.isComplete': i18n.translate('core.euiStepNumber.isComplete', {
      defaultMessage: 'complete',
      description:
        'Used as the title attribute on an image or svg icon to indicate a given process step is complete',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiStyleSelector.buttonText': i18n.translate('core.euiStyleSelector.buttonText', {
      defaultMessage: 'Density',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperDatePicker.showDatesButtonLabel': i18n.translate(
      'core.euiSuperDatePicker.showDatesButtonLabel',
      {
        defaultMessage: 'Show dates',
        description: 'Displayed in a button that shows date picker',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperSelect.screenReaderAnnouncement': ({ optionsCount }: EuiValues) =>
      i18n.translate('core.euiSuperSelect.screenReaderAnnouncement', {
        defaultMessage:
          'You are in a form selector of {optionsCount} items and must select a single option. Use the Up and Down keys to navigate or Escape to close.',
        values: { optionsCount },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperSelectControl.selectAnOption': ({ selectedValue }: EuiValues) =>
      i18n.translate('core.euiSuperSelectControl.selectAnOption', {
        defaultMessage: 'Select an option: {selectedValue}, is selected',
        values: { selectedValue },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperUpdateButton.cannotUpdateTooltip': i18n.translate(
      'core.euiSuperUpdateButton.cannotUpdateTooltip',
      {
        defaultMessage: 'Cannot update',
        description: "Displayed in a tooltip when updates can't happen",
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperUpdateButton.clickToApplyTooltip': i18n.translate(
      'core.euiSuperUpdateButton.clickToApplyTooltip',
      {
        defaultMessage: 'Click to apply',
        description: "Displayed in a tooltip when there are changes that haven't been applied",
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperUpdateButton.refreshButtonLabel': i18n.translate(
      'core.euiSuperUpdateButton.refreshButtonLabel',
      {
        defaultMessage: 'Refresh',
        description: 'Displayed in a button that refreshes based on date picked',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperUpdateButton.updatingButtonLabel': i18n.translate(
      'core.euiSuperUpdateButton.updatingButtonLabel',
      {
        defaultMessage: 'Updating',
        description: 'Displayed in a button that refreshes when updates are happening',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiSuperUpdateButton.updateButtonLabel': i18n.translate(
      'core.euiSuperUpdateButton.updateButtonLabel',
      {
        defaultMessage: 'Update',
        description: 'Displayed in a button that updates based on date picked',
      }
    ),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiTablePagination.rowsPerPage': i18n.translate('core.euiTablePagination.rowsPerPage', {
      defaultMessage: 'Rows per page',
      description: 'Displayed in a button that toggles a table pagination menu',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiTablePagination.rowsPerPageOption': ({ rowsPerPage }: EuiValues) =>
      i18n.translate('core.euiTablePagination.rowsPerPageOption', {
        defaultMessage: '{rowsPerPage} rows',
        description: 'Displayed in a button that toggles the number of visible rows',
        values: { rowsPerPage },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiTableSortMobile.sorting': i18n.translate('core.euiTableSortMobile.sorting', {
      defaultMessage: 'Sorting',
      description: 'Displayed in a button that toggles a table sorting menu',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiToast.dismissToast': i18n.translate('core.euiToast.dismissToast', {
      defaultMessage: 'Dismiss toast',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiToast.newNotification': i18n.translate('core.euiToast.newNotification', {
      defaultMessage: 'A new notification appears',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiToast.notification': i18n.translate('core.euiToast.notification', {
      defaultMessage: 'Notification',
      description: 'ARIA label on an element containing a notification',
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiTreeView.ariaLabel': ({ nodeLabel, ariaLabel }: EuiValues) =>
      i18n.translate('core.euiTreeView.ariaLabel', {
        defaultMessage: '{nodeLabel} child of {ariaLabel}',
        values: { nodeLabel, ariaLabel },
      }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'euiTreeView.listNavigationInstructions': i18n.translate(
      'core.euiTreeView.listNavigationInstructions',
      {
        defaultMessage: 'You can quickly navigate this list using arrow keys.',
      }
    ),
  };

  return euiContextMapping;
};
