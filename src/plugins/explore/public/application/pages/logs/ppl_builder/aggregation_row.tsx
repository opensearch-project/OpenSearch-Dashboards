/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFieldNumber, EuiToolTip } from '@elastic/eui';
import { BuilderAction } from './build_ppl';
import { Aggregation, ScalarCall } from './types';
import { AGG_FN_MAP, SCALAR_FN_MAP } from './operations';
import { FunctionMenu } from './function_menu';
import { AggregationMenu } from './aggregation_menu';
import { FieldMenu } from './field_menu';
import { inputWidth, ControlGroup, RemoveButton } from '../../../components/query_builder';

interface AggregationRowProps {
  agg: Aggregation;
  idx: number;
  /** Numeric-only field names, for aggregations that require a number. */
  numericFieldOptions: string[];
  /** Any aggregatable field, for aggregations that accept non-numeric fields. */
  anyFieldOptions: string[];
  dispatch: React.Dispatch<BuilderAction>;
}

/**
 * One scalar function applied to the aggregation's field (e.g. `round 2`),
 * rendered as a blue chip: the function name in primary text, an editable inline
 * param, and its own ✕ to unwrap. The chip's fill distinguishes it from the
 * neutral group-by chip. Functions render to the RIGHT of the field, so the row
 * reads left-to-right as application order (`field → round → abs` =
 * `abs(round(field))`), matching the innermost-first compile order.
 */
const FunctionPill: React.FC<{
  fn: ScalarCall;
  aggIdx: number;
  fnIdx: number;
  dispatch: React.Dispatch<BuilderAction>;
}> = ({ fn, aggIdx, fnIdx, dispatch }) => {
  const def = SCALAR_FN_MAP[fn.id];
  return (
    <span className="plqFn" data-test-subj={`pplBuilderFn-${aggIdx}-${fnIdx}`}>
      <EuiToolTip content={def?.description || fn.name}>
        <span className="plqFn__name">{fn.name}</span>
      </EuiToolTip>
      {fn.params.map((p, pi) => {
        const placeholder = def?.paramNames?.[pi] || '';
        const displayText = p || placeholder;
        return (
          <input
            key={pi}
            value={p}
            placeholder={placeholder}
            onChange={(e) =>
              dispatch({
                type: 'SET_FUNCTION_PARAM',
                index: aggIdx,
                fnIndex: fnIdx,
                paramIndex: pi,
                value: e.target.value,
              })
            }
            className="plqFn__param"
            style={{ width: inputWidth(displayText, 16, 22, 120) }}
            aria-label={placeholder || fn.name}
            data-test-subj={`pplBuilderFnParam-${aggIdx}-${fnIdx}-${pi}`}
          />
        );
      })}
      <RemoveButton
        variant="chip"
        ariaLabel={i18n.translate('explore.pplBuilder.removeFunction', {
          defaultMessage: 'Remove function',
        })}
        onClick={() => dispatch({ type: 'REMOVE_FUNCTION', index: aggIdx, fnIndex: fnIdx })}
        dataTestSubj={`pplBuilderRemoveFn-${aggIdx}-${fnIdx}`}
      />
    </span>
  );
};

/**
 * One aggregation "Show" group: `Show <fn> of <field>` — the "Show Count
 * of all logs" control. Count needs no field; other fns aggregate over a field,
 * and percentile adds a numeric percentile input. When the group has a field, a
 * `ƒx` trigger wraps it in scalar functions (e.g. avg(round(latency))). The
 * group reads `Show <fn> <field> <fn-chips…> ƒx ✕`.
 */
export const AggregationRow: React.FC<AggregationRowProps> = ({
  agg,
  idx,
  numericFieldOptions,
  anyFieldOptions,
  dispatch,
}) => {
  const def = AGG_FN_MAP[agg.fn];
  const fieldOptions = def?.numericOnly ? numericFieldOptions : anyFieldOptions;
  return (
    <ControlGroup
      label={i18n.translate('explore.pplBuilder.show', { defaultMessage: 'Show' })}
      dataTestSubj={`pplBuilderAgg-${idx}`}
    >
      <AggregationMenu
        value={agg.fn}
        onChange={(fn) => dispatch({ type: 'SET_AGGREGATION', index: idx, agg: { fn } })}
        dataTestSubj={`pplBuilderAggFn-${idx}`}
      />
      {def?.needsField && (
        <>
          <FieldMenu
            options={fieldOptions}
            value={agg.field || ''}
            onChange={(field) => dispatch({ type: 'SET_AGGREGATION', index: idx, agg: { field } })}
            triggerClassName="plqAggTrigger"
            placeholder={i18n.translate('explore.pplBuilder.ofField', {
              defaultMessage: 'of field',
            })}
            dataTestSubj={`pplBuilderAggField-${idx}`}
          />
          {(agg.functions ?? []).map((fn, fnIdx) => (
            <FunctionPill key={fnIdx} fn={fn} aggIdx={idx} fnIdx={fnIdx} dispatch={dispatch} />
          ))}
        </>
      )}
      {agg.fn === 'percentile' && (
        <EuiFieldNumber
          compressed
          controlOnly
          value={agg.percentile ?? 95}
          min={0}
          max={100}
          onChange={(e) => {
            // Clamp to the PPL-valid percentile range: the engine rejects a
            // percentile outside [0,100] with a 500, and `min`/`max` alone don't
            // stop a typed out-of-range value from reaching the query.
            const raw = Number(e.target.value);
            const percentile = Number.isNaN(raw) ? 95 : Math.min(Math.max(raw, 0), 100);
            dispatch({ type: 'SET_AGGREGATION', index: idx, agg: { percentile } });
          }}
          className="plqSpanInterval"
          style={{ width: 52 }}
          aria-label={i18n.translate('explore.pplBuilder.percentileValue', {
            defaultMessage: 'Percentile',
          })}
          data-test-subj={`pplBuilderAggPercentile-${idx}`}
        />
      )}
      {def?.needsField && (
        <FunctionMenu
          onAddFunction={(fn) => dispatch({ type: 'ADD_FUNCTION', index: idx, fn })}
          dataTestSubj={`pplBuilderAddFn-${idx}`}
        />
      )}
      <RemoveButton
        ariaLabel={i18n.translate('explore.pplBuilder.removeAggregation', {
          defaultMessage: 'Remove aggregation',
        })}
        onClick={() => dispatch({ type: 'REMOVE_AGGREGATION', index: idx })}
        dataTestSubj={`pplBuilderRemoveAgg-${idx}`}
      />
    </ControlGroup>
  );
};
