/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { BuilderAction } from './build_ppl';
import { WhereFilter } from './types';
import { FilterEditorPopover, FilterDraft, filterChipLabel } from './filter_editor_popover';
import { GhostAddButton, RemoveButton } from '../../../components/query_builder';

interface WhereRowProps {
  filters: WhereFilter[];
  /** Field names offered in the filter editor's field combobox. */
  fieldNames: string[];
  /** Async value suggestions for a field (best-effort). */
  getValues: (field: string) => Promise<string[]>;
  dispatch: React.Dispatch<BuilderAction>;
}

// Sentinel for "the add-new popover is open" (vs. editing an existing index).
const ADD = -1;

/**
 * The builder's "where" section: a label, one clickable chip per structured
 * filter, and an "Add filter" affordance. Each chip opens the Discover-style
 * {@link FilterEditorPopover} to edit that filter; the empty state shows the
 * shared dashed "Add filter" button. Filters compile to leading `| where` pipe
 * stages (see `buildPPL`) and round-trip from queries via `parsePPL`.
 */
export const WhereRow: React.FC<WhereRowProps> = ({ filters, fieldNames, getValues, dispatch }) => {
  // Which popover is open: ADD for a new filter, an index for editing, or null.
  const [openAt, setOpenAt] = useState<number | null>(null);

  const close = () => setOpenAt(null);

  const saveNew = (draft: FilterDraft) => dispatch({ type: 'ADD_FILTER', filter: draft });
  const saveEdit = (index: number) => (draft: FilterDraft) =>
    dispatch({ type: 'SET_FILTER', index, filter: draft });

  return (
    <span className="plqWhere" data-test-subj="pplBuilderWhere">
      <span className="plqRow__label">
        {i18n.translate('explore.pplBuilder.where', { defaultMessage: 'where' })}
      </span>

      {filters.map((filter, index) => (
        <FilterEditorPopover
          key={filter.id}
          isOpen={openAt === index}
          onClose={close}
          initialFilter={filter}
          fieldNames={fieldNames}
          getValues={getValues}
          onSave={saveEdit(index)}
          button={
            <span className="plqPill" data-test-subj={`pplBuilderFilterChip-${index}`}>
              <button
                type="button"
                className="plqPill__label"
                onClick={() => setOpenAt(index)}
                data-test-subj={`pplBuilderFilterChipButton-${index}`}
              >
                {filterChipLabel(filter)}
              </button>
              <RemoveButton
                variant="chip"
                ariaLabel={i18n.translate('explore.pplBuilder.removeFilter', {
                  defaultMessage: 'Remove filter {label}',
                  values: { label: filterChipLabel(filter) },
                })}
                onClick={() => {
                  if (openAt === index) close();
                  dispatch({ type: 'REMOVE_FILTER', index });
                }}
                dataTestSubj={`pplBuilderRemoveFilter-${index}`}
              />
            </span>
          }
        />
      ))}

      <FilterEditorPopover
        isOpen={openAt === ADD}
        onClose={close}
        fieldNames={fieldNames}
        getValues={getValues}
        onSave={saveNew}
        button={
          <GhostAddButton
            label={i18n.translate('explore.pplBuilder.addFilter', { defaultMessage: 'Add filter' })}
            onClick={() => setOpenAt(ADD)}
            dataTestSubj="pplBuilderAddFilter"
          />
        }
      />
    </span>
  );
};
