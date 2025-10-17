/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { Dictionary, countBy, defaults, uniq } from 'lodash';
import { i18n } from '@osd/i18n';
import { DataView, IndexPatternField } from '../../../../../../plugins/data/public';
import { DatasetManagementStart } from '../../../../../../plugins/dataset_management/public';
import {
  TAB_CORRELATED_DATASETS,
  TAB_CORRELATED_TRACES,
  TAB_INDEXED_FIELDS,
  TAB_SCRIPTED_FIELDS,
  TAB_SOURCE_FILTERS,
} from '../constants';
import { CORE_SIGNAL_TYPES } from '../../../../../data/common';

function filterByName(items: IndexPatternField[], filter: string) {
  const lowercaseFilter = (filter || '').toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(lowercaseFilter));
}

function getCounts(
  fields: IndexPatternField[],
  sourceFilters: {
    excludes: string[];
  },
  fieldFilter = ''
) {
  const fieldCount = countBy(filterByName(fields, fieldFilter), function (field) {
    return field.scripted ? 'scripted' : 'indexed';
  });

  defaults(fieldCount, {
    indexed: 0,
    scripted: 0,
    sourceFilters: sourceFilters.excludes
      ? sourceFilters.excludes.filter((value) =>
          value.toLowerCase().includes(fieldFilter.toLowerCase())
        ).length
      : 0,
  });

  return fieldCount;
}

function getTitle(type: string, filteredCount: Dictionary<number>, totalCount: Dictionary<number>) {
  let title = '';
  switch (type) {
    case 'indexed':
      title = i18n.translate('datasetManagement.editDataset.tabs.fieldsHeader', {
        defaultMessage: 'Fields',
      });
      break;
    case 'scripted':
      title = i18n.translate('datasetManagement.editDataset.tabs.scriptedHeader', {
        defaultMessage: 'Scripted fields',
      });
      break;
    case 'sourceFilters':
      title = i18n.translate('datasetManagement.editDataset.tabs.sourceHeader', {
        defaultMessage: 'Source filters',
      });
      break;
    case 'correlatedDatasets':
      title = i18n.translate('datasetManagement.editDataset.tabs.correlatedDatasetsHeader', {
        defaultMessage: 'Correlated datasets',
      });
      // Don't add count for correlated datasets tab
      return title;
    case 'correlatedTraces':
      title = i18n.translate('datasetManagement.editDataset.tabs.correlatedTracesHeader', {
        defaultMessage: 'Correlated traces',
      });
      break;
  }
  const count = ` (${
    filteredCount[type] === totalCount[type]
      ? filteredCount[type]
      : filteredCount[type] + ' / ' + totalCount[type]
  })`;
  return title + count;
}

export function getTabs(
  dataset: DataView,
  fieldFilter: string,
  datasetListProvider: DatasetManagementStart['list'],
  correlationCount: number = 0
) {
  const totalCount = getCounts(dataset.fields.getAll(), dataset.getSourceFiltering());
  const filteredCount = getCounts(
    dataset.fields.getAll(),
    dataset.getSourceFiltering(),
    fieldFilter
  );

  // Add correlation counts
  totalCount.correlatedDatasets = correlationCount;
  totalCount.correlatedTraces = correlationCount;
  filteredCount.correlatedDatasets = correlationCount;
  filteredCount.correlatedTraces = correlationCount;

  const tabs = [];

  tabs.push({
    name: getTitle('indexed', filteredCount, totalCount),
    id: TAB_INDEXED_FIELDS,
    'data-test-subj': 'tab-indexedFields',
  });

  if (datasetListProvider.areScriptedFieldsEnabled(dataset)) {
    tabs.push({
      name: getTitle('scripted', filteredCount, totalCount),
      id: TAB_SCRIPTED_FIELDS,
      'data-test-subj': 'tab-scriptedFields',
    });
  }

  tabs.push({
    name: getTitle('sourceFilters', filteredCount, totalCount),
    id: TAB_SOURCE_FILTERS,
    'data-test-subj': 'tab-sourceFilters',
  });

  if (dataset.signalType === CORE_SIGNAL_TYPES.TRACES) {
    tabs.push({
      name: getTitle('correlatedDatasets', filteredCount, totalCount),
      id: TAB_CORRELATED_DATASETS,
      'data-test-subj': 'tab-correlatedDatasets',
    });
  }

  if (dataset.signalType === CORE_SIGNAL_TYPES.LOGS) {
    tabs.push({
      name: getTitle('correlatedTraces', filteredCount, totalCount),
      id: TAB_CORRELATED_TRACES,
      'data-test-subj': 'tab-correlatedTraces',
    });
  }

  return tabs;
}

export function getPath(field: IndexPatternField, dataset: DataView) {
  return `/patterns/${dataset?.id}/field/${field.name}`;
}

const allTypesDropDown = i18n.translate('datasetManagement.editDataset.fields.allTypesDropDown', {
  defaultMessage: 'All field types',
});

const allLangsDropDown = i18n.translate('datasetManagement.editDataset.fields.allLangsDropDown', {
  defaultMessage: 'All languages',
});

export function convertToEuiSelectOption(options: string[], type: string) {
  const euiOptions =
    options.length > 0
      ? [
          {
            value: '',
            text: type === 'scriptedFieldLanguages' ? allLangsDropDown : allTypesDropDown,
          },
        ]
      : [];
  return euiOptions.concat(
    uniq(options).map((option) => {
      return {
        value: option,
        text: option,
      };
    })
  );
}
