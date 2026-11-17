/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
// import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/utils';
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
import { DebouncedFieldText } from '../../visualizations/style_panel/utils';
import { uniqueFieldName } from '../merge_series';

export interface OrganizeFieldsConfig {
  // field -> true: hidden.
  excludeByName: Record<string, boolean>;
  // field -> new name.
  renameByName: Record<string, string>;
  // field -> position; fields without one keep their order, after the placed ones.
  indexByName: Record<string, number>;
}

/** Fields in display order: placed fields by position, then the rest in their own order. */
export const orderFields = <T extends { name: string }>(
  fields: T[],
  indexByName: Record<string, number> = {}
): T[] => {
  const placed = fields
    .filter(({ name }) => indexByName[name] !== undefined)
    .sort((a, b) => indexByName[a.name] - indexByName[b.name]);
  return [...placed, ...fields.filter(({ name }) => indexByName[name] === undefined)];
};

const OrganizeFieldsEditor = ({
  config,
  onChange,
  availableFields,
}: TransformationEditorProps<OrganizeFieldsConfig>) => {
  const { excludeByName = {}, renameByName = {}, indexByName = {} } = config;
  const ordered = orderFields(availableFields, indexByName);

  if (ordered.length === 0) {
    return (
      <EuiText size="s" color="subdued">
        {i18n.translate('explore.transformations.organizeFields.noFields', {
          defaultMessage: 'Run the queries to organize their fields.',
        })}
      </EuiText>
    );
  }

  const move = (from: number, to: number) => {
    const names = ordered.map(({ name }) => name);
    const [moved] = names.splice(from, 1);
    names.splice(to, 0, moved);
    onChange({ ...config, indexByName: Object.fromEntries(names.map((n, i) => [n, i])) });
  };

  return (
    <EuiFlexGroup direction="column" gutterSize="xs" data-test-subj="organizeFieldsList">
      {ordered.map(({ name, type }, index) => {
        const hidden = Boolean(excludeByName[name]);
        return (
          <EuiFlexItem key={name}>
            <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType={hidden ? 'eyeClosed' : 'eye'}
                  color={hidden ? 'subdued' : 'text'}
                  aria-label={i18n.translate('explore.transformations.organizeFields.toggle', {
                    defaultMessage: 'Show or hide {name}',
                    values: { name },
                  })}
                  onClick={() =>
                    onChange({ ...config, excludeByName: { ...excludeByName, [name]: !hidden } })
                  }
                  data-test-subj={`organizeFieldsToggle-${name}`}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={2}>
                <EuiText size="s" color={hidden ? 'subdued' : 'default'}>
                  <span title={type}>{name}</span>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={3}>
                <DebouncedFieldText
                  value={renameByName[name] ?? ''}
                  placeholder={i18n.translate('explore.transformations.organizeFields.rename', {
                    defaultMessage: 'Rename',
                  })}
                  disabled={hidden}
                  onChange={(value) => {
                    const next = { ...renameByName };
                    if (value.trim()) next[name] = value.trim();
                    else delete next[name];
                    onChange({ ...config, renameByName: next });
                  }}
                  data-test-subj={`organizeFieldsRename-${name}`}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="sortUp"
                  color="text"
                  isDisabled={index === 0}
                  aria-label={i18n.translate('explore.transformations.organizeFields.moveUp', {
                    defaultMessage: 'Move {name} up',
                    values: { name },
                  })}
                  onClick={() => move(index, index - 1)}
                  data-test-subj={`organizeFieldsUp-${name}`}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="sortDown"
                  color="text"
                  isDisabled={index === ordered.length - 1}
                  aria-label={i18n.translate('explore.transformations.organizeFields.moveDown', {
                    defaultMessage: 'Move {name} down',
                    values: { name },
                  })}
                  onClick={() => move(index, index + 1)}
                  data-test-subj={`organizeFieldsDown-${name}`}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
};

/**
 * Hides, renames and reorders fields on each series. It works on the series (not just rows) so a
 * renamed field keeps its declared type and the new order reaches the schema.
 */
export const organizeFieldsMethod = (
  series: SeriesResult[],
  config: OrganizeFieldsConfig
): SeriesExecutionResult => {
  const { excludeByName = {}, renameByName = {}, indexByName = {} } = config;
  const changes =
    Object.values(excludeByName).some(Boolean) ||
    Object.keys(renameByName).length > 0 ||
    Object.keys(indexByName).length > 0;
  if (!changes) return { series, status: 'skipped', issues: [] };

  // const outName = (name: string) => renameByName[name] || name;
  // Renames that would reuse a name another kept field has: skipped, the field keeps its name.
  const clashes = new Set<string>();
  const organized = series.map((oneSeries) => {
    const kept = orderFields(oneSeries.fieldSchema, indexByName).filter(
      ({ name }) => !excludeByName[name]
    );
    // Output names: fields that aren't renamed keep theirs first, then the renames that are free.
    const taken = new Set(kept.filter(({ name }) => !renameByName[name]).map(({ name }) => name));
    const outNames = new Map<string, string>();
    kept.forEach(({ name }) => {
      const rename = renameByName[name];
      if (!rename) {
        outNames.set(name, name);
        return;
      }
      if (taken.has(rename)) clashes.add(`${name} → ${rename}`);
      const out = taken.has(rename) ? uniqueFieldName(name, taken) : rename;
      taken.add(out);
      outNames.set(name, out);
    });
    const outName = (name: string) => outNames.get(name) ?? name;

    const fieldSchema: FieldSchema[] = kept.map((field) => ({
      ...field,
      name: outName(field.name),
    }));
    const rows = oneSeries.rows.map((row) => {
      const out: NormalizedRow = {};
      kept.forEach(({ name }) => {
        // if (name in row) out[outName(name)] = row[name];
        if (row[name] !== undefined) out[outName(name)] = row[name];
      });
      // Only schema fields are output, as in the other steps.
      // // Keys outside the schema aren't organized; keep them unless hidden.
      // Object.keys(row).forEach((key) => {
      //   if (!excludeByName[key] && !kept.some(({ name }) => name === key)) {
      //     out[outName(key)] = row[key];
      //   }
      // });
      return out;
    });
    return { ...oneSeries, rows, fieldSchema };
  });

  if (clashes.size > 0) {
    return {
      series: organized,
      status: 'partially_applied',
      issues: [
        {
          // Not invalid_config: the step editor hides that code (it means "not set up yet").
          code: 'duplicate_keys',
          message: `A new name is already used by another field, so the field keeps its name: ${Array.from(
            clashes
          ).join(', ')}`,
        },
      ],
    };
  }
  return { series: organized, status: 'applied', issues: [] };
};

export function createOrganizeFieldsTransformation(): MultiSeriesTransformationInstance<OrganizeFieldsConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'organize_fields',
    config: { excludeByName: {}, renameByName: {}, indexByName: {} },
    hide: false,
    seriesMethod: organizeFieldsMethod,
    Editor: OrganizeFieldsEditor,
  };
}

export const organizeFieldsTransformationDefinition: TransformationDefinition<OrganizeFieldsConfig> =
  {
    id: 'organize_fields',
    type: 'format',
    label: i18n.translate('explore.transformations.organizeFields.label', {
      defaultMessage: 'Organize fields',
    }),
    description: i18n.translate('explore.transformations.organizeFields.description', {
      defaultMessage: 'Rename, reorder, or hide fields.',
    }),
    iconType: 'list',
    createInstance: createOrganizeFieldsTransformation,
  };

export const organizeFieldsConfigSchema: TransformationConfigSchema = {
  excludeByName: {
    description: 'Map of field name to true for each field to hide.',
    kind: 'object[]',
    defaultValue: {},
    required: false,
  },
  renameByName: {
    description: 'Map of field name to its new name.',
    kind: 'object[]',
    defaultValue: {},
    required: false,
  },
  indexByName: {
    description: 'Map of field name to its position (0 first); unlisted fields follow in order.',
    kind: 'object[]',
    defaultValue: {},
    required: false,
  },
};
