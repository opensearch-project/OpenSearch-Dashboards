/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { EuiButtonIcon, EuiToolTip, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Bucket } from './types';
import { DataViewField } from '../../../../data/public';
import { shortenDottedString } from '../../application/legacy/discover/application/helpers';
import { wrapOnDot } from '../../../../opensearch_dashboards_react/public';
import './discover_field.scss';
import './facet_value.scss';

export interface FacetValueProps {
  /**
   * The facet field
   */
  field: DataViewField;
  /**
   * The bucket contains facet field value
   */
  bucket: Bucket;
  /**
   * Callback to add a filter to filter bar
   */
  onAddFilter: (field: DataViewField | string, value: string, type: '+' | '-') => void;
  /**
   * Determines whether the field name is shortened test.sub1.sub2 = t.s.sub2
   */
  useShortDots?: boolean;
}

export const FacetValue = ({ field, bucket, onAddFilter, useShortDots }: FacetValueProps) => {
  const filterForLabelAria = i18n.translate(
    'agentTraces.discover.fieldChooser.discoverField.filterForAriaLabel',
    {
      defaultMessage: 'Filter for {value}',
      values: { value: bucket.display },
    }
  );

  const filterOutLabelAria = i18n.translate(
    'agentTraces.discover.fieldChooser.discoverField.filterOutAriaLabel',
    {
      defaultMessage: 'Filter out {value}',
      values: { value: bucket.display },
    }
  );

  const wrappedDisplay = useMemo(
    () =>
      useShortDots ? wrapOnDot(shortenDottedString(bucket.display)) : wrapOnDot(bucket.display),
    [bucket.display, useShortDots]
  );

  const displayValue = (
    <EuiToolTip delay="long" content={bucket.display}>
      <span
        data-test-subj={`field-${bucket.display}`}
        className="agentTracesSidebarField__name eui-textBreakWord"
      >
        {wrappedDisplay}
      </span>
    </EuiToolTip>
  );

  return (
    <EuiFlexGroup
      gutterSize="s"
      alignItems="center"
      responsive={false}
      className="agentTracesSidebarFacetValue agentTracesSidebarField"
      data-test-subj="agentTracesSidebarFacetValue"
    >
      <EuiFlexItem grow>
        <EuiText size="xs">{displayValue}</EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size="xs" className="agentTracesSidebarFacetValue__count">
          {bucket.count}
        </EuiText>
      </EuiFlexItem>
      <div className="agentTracesSidebarField__actionButtons">
        <EuiToolTip
          delay="long"
          content={i18n.translate(
            'agentTraces.discover.fieldChooser.discoverField.filterForTooltip',
            {
              defaultMessage: 'Filter for value',
            }
          )}
        >
          <EuiButtonIcon
            iconType="magnifyWithPlus"
            onClick={() => onAddFilter(field, bucket.value, '+')}
            size="xs"
            data-test-subj={`fieldToggle-${bucket.display}`}
            aria-label={filterForLabelAria}
            className="agentTracesSidebarField__actionButton"
          />
        </EuiToolTip>
        <EuiToolTip
          delay="long"
          content={i18n.translate(
            'agentTraces.discover.fieldChooser.discoverField.filterOutTooltip',
            {
              defaultMessage: 'Filter out value',
            }
          )}
        >
          <EuiButtonIcon
            iconType="magnifyWithMinus"
            onClick={() => onAddFilter(field, bucket.value, '-')}
            size="xs"
            data-test-subj={`fieldToggle-${bucket.display}`}
            aria-label={filterOutLabelAria}
            className="agentTracesSidebarField__actionButton"
          />
        </EuiToolTip>
      </div>
    </EuiFlexGroup>
  );
};
