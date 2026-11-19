/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EuiButtonGroup, EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/types';
import {
  FieldSchema,
  MultiSeriesTransformationInstance,
  NormalizedRow,
  SeriesExecutionResult,
  TransformationConfigSchema,
  TransformationDefinition,
  TransformationEditorProps,
} from '../types';
import { uniqueFieldName } from '../merge_series';
import { combinedRefId, mergeDisplayNames, skippedSeriesResult } from './series_utils';

// label: a repeated name is kept as `name (refId)`; ignore: a repeated name is dropped.
type Concatenatemode = 'label' | 'ignore';
interface ConcatenateFieldsConfig {
  mode?: Concatenatemode;
}

const modeOptions = [
  {
    id: 'label',
    label: i18n.translate('explore.transformations.concatenateFields.modeLabel', {
      defaultMessage: 'Keep as label',
    }),
  },
  {
    id: 'ignore',
    label: i18n.translate('explore.transformations.concatenateFields.modeIgnore', {
      defaultMessage: 'Ignore',
    }),
  },
];

const ConcatenateFieldsEditor = ({
  config,
  onChange,
}: TransformationEditorProps<ConcatenateFieldsConfig>) => {
  const mode = config.mode ?? 'label';
  return (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('explore.transformations.concatenateFields.mode', {
            defaultMessage: 'Mode',
          })}
          display="columnCompressed"
        >
          <EuiButtonGroup
            legend={i18n.translate('explore.transformations.concatenateFields.modeLegend', {
              defaultMessage: 'Query name',
            })}
            options={modeOptions}
            idSelected={mode}
            onChange={(id) => onChange({ ...config, mode: id as Concatenatemode })}
            buttonSize="compressed"
            isFullWidth
            data-test-subj="concatenateFieldsmodeButtonGroup"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiText size="s" color="subdued" data-test-subj="concatenateFieldsTransformationHelp">
          {mode === 'label'
            ? i18n.translate('explore.transformations.concatenateFields.labelHelp', {
                defaultMessage:
                  "Puts every query's fields side by side: row N holds row N of each query. A field whose name an earlier query already has is kept as name (refId), e.g. count (B).",
              })
            : i18n.translate('explore.transformations.concatenateFields.ignoreHelp', {
                defaultMessage:
                  "Puts every query's fields side by side: row N holds row N of each query. A field whose name an earlier query already has is dropped, with its values.",
              })}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/**
 * All fields of all series in one series, side by side by row position.
 * - label (default): a duplicate field from a later series is renamed `name (refId)`, so both stay.
 * - ignore: a duplicate field from a later series is dropped.
 * Row N of the output holds row N of every series; a shorter series leaves its fields out of the
 * extra rows. Only schema fields are output. With fewer than two series the step is skipped.
 *
 * @example
 * input
 * [
 *   { refId: 'A', fieldSchema: [{ name: 'v', type: 'integer' }],
 *     rows: [{ v: 1 }, { v: 2 }] },
 *   { refId: 'B', fieldSchema: [{ name: 'v', type: 'integer' }, { name: 'w', type: 'integer' }],
 *     rows: [{ v: 9, w: 3 }] },
 * ]
 * output, label
 * {
 *   refId: 'A,B',
 *   fieldSchema: [{ name: 'v', ... }, { name: 'v (B)', ... }, { name: 'w', ... }],
 *   rows: [{ v: 1, 'v (B)': 9, w: 3 }, { v: 2 }],
 * }
 * output, ignore
 * {
 *   refId: 'A,B',
 *   fieldSchema: [{ name: 'v', ... }, { name: 'w', ... }],
 *   rows: [{ v: 1, w: 3 }, { v: 2 }],
 * }
 */
export const concatenateFieldsMethod = (
  series: SeriesResult[],
  config: ConcatenateFieldsConfig = {}
): SeriesExecutionResult => {
  if (series.length <= 1) return skippedSeriesResult(series);
  const keepmode = (config.mode ?? 'label') === 'label';

  const taken = new Set<string>();
  const fieldSchema: FieldSchema[] = [];
  // Per series: its field name -> the output key (missing when the field is left out).
  const keysBySeries = series.map((oneSeries) => {
    const keys = new Map<string, string>();
    oneSeries.fieldSchema.forEach((field) => {
      // ignore mode: a repeated column is dropped
      if (taken.has(field.name) && !keepmode) return;
      const key = taken.has(field.name)
        ? uniqueFieldName(`${field.name} (${oneSeries.refId})`, taken)
        : field.name;
      taken.add(key);
      keys.set(field.name, key);
      // key is the field's own name, or `name (refId)` for a repeated name (label mode).
      fieldSchema.push({ ...field, name: key });
    });
    return keys;
  });

  const rowCount = Math.max(...series.map(({ rows }) => rows.length));
  const rows: NormalizedRow[] = Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: NormalizedRow = {};
    series.forEach((oneSeries, seriesIndex) => {
      const source = oneSeries.rows[rowIndex];
      if (!source) return;
      const keys = keysBySeries[seriesIndex];
      // Only schema fields are output; a row key outside the schema is left out.
      keys.forEach((key, name) => {
        if (Object.prototype.hasOwnProperty.call(source, name)) row[key] = source[name];
      });
    });
    return row;
  });

  // merge each series's displayNames
  const merged = mergeDisplayNames(series);
  return {
    series: [
      {
        refId: combinedRefId(series),
        rows,
        fieldSchema,
        seriesDisplayNames: merged,
      },
    ],
    status: 'applied',
    issues: [],
  };
};

export function createConcatenateFieldsTransformation(): MultiSeriesTransformationInstance<ConcatenateFieldsConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'concatenate_fields',
    // config: {},
    config: { mode: 'label' },
    hide: false,
    seriesMethod: concatenateFieldsMethod,
    Editor: ConcatenateFieldsEditor,
  };
}

export const concatenateFieldsTransformationDefinition: TransformationDefinition<ConcatenateFieldsConfig> =
  {
    id: 'concatenate_fields',
    type: 'combine',
    label: i18n.translate('explore.transformations.concatenateFields.label', {
      defaultMessage: 'Concatenate fields',
    }),
    description: i18n.translate('explore.transformations.concatenateFields.description', {
      defaultMessage: "Combine every query's fields into one table, side by side by row.",
    }),
    iconType: 'tableOfContents',
    createInstance: createConcatenateFieldsTransformation,
  };

export const concatenateFieldsConfigSchema: TransformationConfigSchema = {
  mode: {
    description:
      'label: a repeated name is renamed `name (refId)`, so both fields stay. ignore: a repeated name is left out.',
    kind: 'enum',
    defaultValue: 'label',
    enumOptions: [
      { value: 'label', label: 'Keep as label' },
      { value: 'ignore', label: 'Ignore' },
    ],
  },
};
