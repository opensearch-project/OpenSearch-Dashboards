/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './facet_value.scss';

import React from 'react';
import { EuiButtonIcon, EuiToolTip, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Bucket } from './types';
import { DataViewField } from '../../../../data/public';
import { shortenDottedString } from '../../application/legacy/discover/application/helpers';
import './discover_field.scss';

function wrapOnDot(str?: string) {
  // u200B is a non-width white-space character, which allows
  // the browser to efficiently word-wrap right after the dot
  // without us having to draw a lot of extra DOM elements, etc
  return str ? str.replace(/\./g, '.\u200B') : '';
}

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
    'explore.discover.fieldChooser.discoverField.filterForAriaLabel',
    {
      defaultMessage: 'Filter for {value}',
      values: { value: bucket.display },
    }
  );

  const filterOutLabelAria = i18n.translate(
    'explore.discover.fieldChooser.discoverField.filterOutAriaLabel',
    {
      defaultMessage: 'Filter out {value}',
      values: { value: bucket.display },
    }
  );

  const displayValue = (
    <EuiToolTip delay="long" content={bucket.display}>
      <span
        data-test-subj={`field-${bucket.display}`}
        className="exploreSidebarFacetValue__name eui-textBreakWord"
      >
        {useShortDots ? wrapOnDot(shortenDottedString(bucket.display)) : wrapOnDot(bucket.display)}
      </span>
    </EuiToolTip>
  );

  return (
    <EuiFlexGroup
      gutterSize="s"
      alignItems="center"
      responsive={false}
      className="exploreSidebarFacetValue"
      data-test-subj="exploreSidebarFacetValue"
    >
      <EuiFlexItem grow>
        <EuiText size="xs">{displayValue}</EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false} className="exploreSidebarFacetValue__actionButtons">
        <EuiToolTip
          delay="long"
          content={i18n.translate('explore.discover.fieldChooser.discoverField.filterForTooltip', {
            defaultMessage: 'Filter for value',
          })}
        >
          <EuiButtonIcon
            iconType="magnifyWithPlus"
            onClick={() => onAddFilter(field, bucket.value, '+')}
            size="xs"
            data-test-subj={`fieldToggle-${bucket.display}`}
            aria-label={filterForLabelAria}
            className="exploreSidebarFacetValue__actionButton"
          />
        </EuiToolTip>
        <EuiToolTip
          delay="long"
          content={i18n.translate('explore.discover.fieldChooser.discoverField.filterOutTooltip', {
            defaultMessage: 'Filter out value',
          })}
        >
          <EuiButtonIcon
            iconType="magnifyWithMinus"
            onClick={() => onAddFilter(field, bucket.value, '-')}
            size="xs"
            data-test-subj={`fieldToggle-${bucket.display}`}
            aria-label={filterOutLabelAria}
            className="exploreSidebarFacetValue__actionButton"
          />
        </EuiToolTip>
        <EuiText size="xs" className="exploreSidebarFacetValue__count">
          {bucket.count}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
