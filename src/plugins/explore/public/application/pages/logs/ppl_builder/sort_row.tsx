/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiSuperSelect } from '@elastic/eui';
import { BuilderAction } from './build_ppl';
import { FieldMenu } from './field_menu';
import { Sort } from './types';
import { ControlGroup, GhostAddButton, RemoveButton } from '../../../components/query_builder';

interface SortRowProps {
  /** The current sort, or undefined when the query is unsorted. */
  sort?: Sort;
  /**
   * Candidate sort columns: the aggregated query's output columns (metrics +
   * group-by fields) when the query aggregates, otherwise the dataset's fields
   * for sorting raw search rows. Offered as combobox suggestions; any value may
   * still be typed since sort is a free pipe operation.
   */
  columns: string[];
  dispatch: React.Dispatch<BuilderAction>;
}

const DESC = 'desc';
const ASC = 'asc';

/**
 * The builder's sort control — its own top-level pipe operation (`… | sort
 * -\`count()\``), a sibling of the aggregation rather than part of the grouping.
 * Pick one column and a direction. It applies to an aggregated result (sorting
 * by an output column) or to raw search rows (sorting by any field), so it is
 * offered independently of whether the query aggregates. Collapses to an "Add
 * sort" affordance when unsorted, mirroring the empty-state "Add metric" button.
 */
export const SortRow: React.FC<SortRowProps> = ({ sort, columns, dispatch }) => {
  if (!sort) {
    return (
      <GhostAddButton
        label={i18n.translate('explore.pplBuilder.sort', { defaultMessage: 'Sort' })}
        onClick={() =>
          dispatch({ type: 'SET_SORT', sort: { column: columns[0] ?? '', desc: true } })
        }
        dataTestSubj="pplBuilderAddSort"
      />
    );
  }

  const setColumn = (column: string) => dispatch({ type: 'SET_SORT', sort: { ...sort, column } });

  return (
    <ControlGroup
      label={i18n.translate('explore.pplBuilder.sortBy', { defaultMessage: 'Sort by' })}
      dataTestSubj="pplBuilderSortChip"
    >
      <FieldMenu
        options={columns}
        value={sort.column}
        onChange={setColumn}
        triggerClassName="plqAggTrigger"
        placeholder={i18n.translate('explore.pplBuilder.sortColumnPlaceholder', {
          defaultMessage: 'column',
        })}
        dataTestSubj="pplBuilderSortColumn"
      />
      <EuiSuperSelect
        compressed
        options={[
          {
            value: DESC,
            inputDisplay: i18n.translate('explore.pplBuilder.sortDesc', {
              defaultMessage: 'Desc',
            }),
          },
          {
            value: ASC,
            inputDisplay: i18n.translate('explore.pplBuilder.sortAsc', {
              defaultMessage: 'Asc',
            }),
          },
        ]}
        valueOfSelected={sort.desc ? DESC : ASC}
        onChange={(value) =>
          dispatch({ type: 'SET_SORT', sort: { ...sort, desc: value === DESC } })
        }
        style={{ minWidth: 64 }}
        data-test-subj="pplBuilderSortDirection"
      />
      <RemoveButton
        ariaLabel={i18n.translate('explore.pplBuilder.removeSort', {
          defaultMessage: 'Remove sort',
        })}
        onClick={() => dispatch({ type: 'REMOVE_SORT' })}
        dataTestSubj="pplBuilderRemoveSort"
      />
    </ControlGroup>
  );
};
