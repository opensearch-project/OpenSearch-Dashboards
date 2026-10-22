/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useEffect, useRef, useState } from 'react';
import { DataViewField } from '../../../../data/public';
import { useIncrementalRender } from '../../helpers/use_incremental_render';
import { DiscoverField } from './discover_field';
import { DiscoverSidebarProps } from './discover_sidebar';
import { FieldDetails } from './types';

interface FieldGroupProps extends DiscoverSidebarProps {
  category: 'query' | 'discovered' | 'selected';
  title: string;
  fields: DataViewField[];
  getDetailsByField: (field: DataViewField) => FieldDetails;
  shortDotsEnabled: boolean;
}

// Fields are mounted in pages as the list scrolls, so a wide index pattern does not put every
// field in the DOM at once. Past the cap, scrolling stops growing the list and a button takes
// over, which bounds the worst case regardless of pattern size.
export const FIELD_LIST_PAGE_SIZE = 50;
export const FIELD_LIST_SCROLL_CAP = 500;
// The discovered group holds every pattern field not present in the hits; for wide patterns it
// is thousands of entries nobody scrolls through, so it starts collapsed above this size.
export const DISCOVERED_AUTO_COLLAPSE_THRESHOLD = 200;

export const FieldList = ({
  category,
  title,
  fields,
  columns,
  selectedDataSet,
  onAddField,
  onRemoveField,
  onAddFilter,
  getDetailsByField,
  shortDotsEnabled,
}: FieldGroupProps) => {
  const shouldStartExpanded =
    category !== 'discovered' || fields.length <= DISCOVERED_AUTO_COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(shouldStartExpanded);
  // This component stays mounted across dataset changes and across async field loading, so
  // the auto-collapse decision is re-evaluated when either settles. Once the user has toggled
  // the group for the current dataset, their choice wins until the dataset changes; a field
  // refetch for the same dataset also flips `fieldsLoading`, and must not undo it.
  const datasetId = selectedDataSet?.id;
  const fieldsLoading = selectedDataSet?.fieldsLoading;
  const userToggledRef = useRef(false);
  useEffect(() => {
    userToggledRef.current = false;
  }, [datasetId]);
  useEffect(() => {
    if (!fieldsLoading && !userToggledRef.current) {
      setExpanded(shouldStartExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, fieldsLoading]);
  const toggleExpanded = () => {
    userToggledRef.current = true;
    setExpanded((prev) => !prev);
  };
  const { count, hasMore, capped, sentinelRef, showMore } = useIncrementalRender({
    total: fields.length,
    pageSize: FIELD_LIST_PAGE_SIZE,
    cap: FIELD_LIST_SCROLL_CAP,
    enabled: expanded,
    resetKey: selectedDataSet?.id,
  });

  if (!selectedDataSet) return null;

  const hiddenCount = fields.length - count;

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="none">
      <EuiButtonEmpty
        iconSide="left"
        color="text"
        iconType={expanded ? 'arrowDown' : 'arrowRight'}
        onClick={toggleExpanded}
        size="xs"
        className="exploreSideBar_fieldGroup"
        data-test-subj="dscSideBarFieldGroupButton"
        aria-label={title}
        isLoading={!!selectedDataSet.fieldsLoading}
      >
        {title}
        {!expanded && fields.length > 0 && (
          <span className="exploreSideBar_fieldGroupCount" data-test-subj="fieldList-groupCount">
            {fields.length}
          </span>
        )}
      </EuiButtonEmpty>
      {expanded &&
        fields.slice(0, count).map((field: DataViewField) => {
          return (
            <EuiPanel
              data-attr-field={field.name}
              key={field.name}
              paddingSize="none"
              hasBorder={false}
              hasShadow={false}
              color="transparent"
              className="exploreSideBar__item"
              data-test-subj={`fieldList-field`}
            >
              {/* The panel cannot exist in the DiscoverField component if the on focus highlight during keyboard navigation is needed */}
              <DiscoverField
                selected={category === 'selected'}
                field={field}
                columns={columns}
                dataSet={selectedDataSet}
                onAddField={onAddField}
                onRemoveField={onRemoveField}
                onAddFilter={onAddFilter}
                getDetails={getDetailsByField}
                useShortDots={shortDotsEnabled}
                showSummary={category !== 'discovered'}
              />
            </EuiPanel>
          );
        })}
      {expanded && hasMore && !capped && (
        <div
          ref={sentinelRef}
          className="exploreSideBar__sentinel"
          data-test-subj="fieldList-sentinel"
        />
      )}
      {expanded && capped && (
        <EuiButtonEmpty
          size="xs"
          color="text"
          iconType="arrowDown"
          className="exploreSideBar_showMore"
          data-test-subj="fieldList-showMore"
          onClick={() => showMore()}
        >
          {i18n.translate('explore.discover.fieldChooser.fieldList.showMoreButtonLabel', {
            defaultMessage: 'Show {count} more ({hidden} hidden)',
            values: { count: Math.min(FIELD_LIST_PAGE_SIZE, hiddenCount), hidden: hiddenCount },
          })}
        </EuiButtonEmpty>
      )}
    </EuiPanel>
  );
};
