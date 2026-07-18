/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiToolTip } from '@elastic/eui';
import { BuilderAction } from './build_ppl';
import { FieldMenu } from './field_menu';
import { SpanIntervalMenu } from './span_interval_menu';
import { GroupBy, TimeBucket } from './types';
import { ControlGroup, FieldPill, RemoveButton } from '../../../components/query_builder';

const SPAN_INTERVAL_RE =
  /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|M|q|y|second|minute|hour|day|week|month|quarter|year)?s?$/i;

const spanTooltip = (field: string, interval: string) =>
  i18n.translate('explore.pplBuilder.spanTooltip', {
    defaultMessage: 'span({field}, {interval}) — uses the dataset’s time field',
    values: { field, interval },
  });

interface SpanChipProps {
  span: TimeBucket;
  dispatch: React.Dispatch<BuilderAction>;
}

const SpanChip: React.FC<SpanChipProps> = ({ span, dispatch }) => (
  <EuiToolTip content={spanTooltip(span.field, span.interval)} position="top">
    <span className="plqChip" data-test-subj="pplBuilderSpanChip">
      <span className="plqChip__nat">
        {i18n.translate('explore.pplBuilder.every', { defaultMessage: 'every' })}
      </span>
      <SpanIntervalMenu
        interval={span.interval}
        isInvalid={!SPAN_INTERVAL_RE.test(span.interval.trim())}
        onChange={(interval) =>
          dispatch({ type: 'SET_SPAN', span: { field: span.field, interval, auto: false } })
        }
        dataTestSubj="pplBuilderSpanInterval"
      />
      <RemoveButton
        ariaLabel={i18n.translate('explore.pplBuilder.removeSpan', {
          defaultMessage: 'Remove time grouping',
        })}
        onClick={() => dispatch({ type: 'REMOVE_SPAN' })}
        dataTestSubj="pplBuilderRemoveSpan"
      />
    </span>
  </EuiToolTip>
);

interface GroupByRowProps {
  groupBy: GroupBy;
  options: string[];
  timeFieldName: string;
  autoInterval: string;
  onAddSpan: () => void;
  autoOpen?: boolean;
  dispatch: React.Dispatch<BuilderAction>;
}

export const GroupByRow: React.FC<GroupByRowProps> = ({
  groupBy,
  options,
  timeFieldName,
  autoInterval,
  onAddSpan,
  autoOpen,
  dispatch,
}) => {
  const hasSelection = groupBy.fields.length > 0 || !!groupBy.span;

  return (
    <ControlGroup
      label={i18n.translate('explore.pplBuilder.by', { defaultMessage: 'Group by' })}
      dataTestSubj="pplBuilderGroupBy"
    >
      <FieldMenu
        multi
        autoOpen={autoOpen}
        options={options}
        value={groupBy.fields}
        onChange={(fields) => dispatch({ type: 'SET_GROUPBY_FIELDS', fields })}
        overTime={
          groupBy.span
            ? undefined
            : {
                hint: i18n.translate('explore.pplBuilder.overTimeHint', {
                  defaultMessage: 'every {interval}',
                  values: { interval: autoInterval },
                }),
                tooltip: spanTooltip(timeFieldName, autoInterval),
                onSelect: onAddSpan,
              }
        }
        dataTestSubj="pplBuilderGroupByFields"
        placeholder={i18n.translate('explore.pplBuilder.groupByEverything', {
          defaultMessage: 'Everything',
        })}
        triggerClassName="plqAggTrigger"
        caretAriaLabel={i18n.translate('explore.pplBuilder.editGroupByFields', {
          defaultMessage: 'Edit group-by fields',
        })}
        renderTrigger={
          hasSelection
            ? () => (
                <>
                  {groupBy.fields.map((f) => (
                    <FieldPill
                      key={f}
                      label={f}
                      removeAriaLabel={i18n.translate('explore.pplBuilder.removeGroupByField', {
                        defaultMessage: 'Remove {field}',
                        values: { field: f },
                      })}
                      onRemove={() =>
                        dispatch({
                          type: 'SET_GROUPBY_FIELDS',
                          fields: groupBy.fields.filter((x) => x !== f),
                        })
                      }
                    />
                  ))}
                  {groupBy.span && <SpanChip span={groupBy.span} dispatch={dispatch} />}
                </>
              )
            : undefined
        }
      />
    </ControlGroup>
  );
};
