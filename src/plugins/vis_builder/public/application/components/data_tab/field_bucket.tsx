/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiText,
  EuiSmallButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiProgress,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { IndexPatternField } from '../../../../../data/public';

import { Bucket } from './types';
import './field_bucket.scss';
import { useOnAddFilter } from '../../utils/use';

interface FieldBucketProps {
  bucket: Bucket;
  field: IndexPatternField;
}

export function FieldBucket({ bucket, field }: FieldBucketProps) {
  const { count, display, percent, value } = bucket;
  const { filterable: isFilterableField, name: fieldName } = field;

  const onAddFilter = useOnAddFilter();

  const emptyText = i18n.translate('visBuilder.fieldSelector.detailsView.emptyStringText', {
    // We need this to communicate to users when a top value is actually an empty string
    defaultMessage: 'Empty string',
  });
  const addText = i18n.translate('visBuilder.fieldSelector.detailsView.filterValueButtonToolTip', {
    defaultMessage: 'Filter for value',
  });
  const addLabel = i18n.translate(
    'visBuilder.fieldSelector.detailsView.filterValueButtonAriaLabel',
    {
      defaultMessage: 'Filter for {fieldName}: "{value}"',
      values: { fieldName, value },
    }
  );
  const removeText = i18n.translate(
    'visBuilder.fieldSelector.detailsView.filterOutValueButtonToolTip',
    {
      defaultMessage: 'Filter out value',
    }
  );
  const removeLabel = i18n.translate(
    'visBuilder.fieldSelector.detailsView.filterOutValueButtonAriaLabel',
    {
      defaultMessage: 'Filter out {fieldName}: "{value}"',
      values: { fieldName, value },
    }
  );

  const displayValue = display || emptyText;

  return (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" responsive={false} gutterSize="s">
        <EuiFlexItem className="vbFieldDetails__barContainer" grow={1}>
          <EuiFlexGroup justifyContent="spaceBetween" gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={1} className="eui-textTruncate">
              <EuiText
                title={`${displayValue}: ${count} (${percent.toFixed(1)}%)`}
                size="xs"
                className="eui-textTruncate"
              >
                {displayValue}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false} className="eui-textTruncate">
              <EuiText color="secondary" size="xs" className="eui-textTruncate">
                {percent.toFixed(1)}%
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiProgress
            value={percent}
            max={100}
            color="secondary"
            aria-label={`${value}: ${count} (${percent}%)`}
            size="s"
          />
        </EuiFlexItem>
        {/* TODO: Should we have any explanation for non-filterable fields? */}
        {isFilterableField && (
          <EuiFlexItem grow={false}>
            <div>
              <EuiToolTip content={addText} delay="long" position="bottom">
                <EuiSmallButtonIcon
                  className="vbFieldDetails__filterButton"
                  iconSize="s"
                  iconType="plusInCircle"
                  onClick={() => onAddFilter(field, value, '+')}
                  aria-label={addLabel}
                  data-test-subj={`plus-${fieldName}-${value}`}
                />
              </EuiToolTip>
              <EuiToolTip content={removeText} delay="long" position="bottom">
                <EuiSmallButtonIcon
                  className="vbFieldDetails__filterButton"
                  iconSize="s"
                  iconType="minusInCircle"
                  onClick={() => onAddFilter(field, value, '-')}
                  aria-label={removeLabel}
                  data-test-subj={`minus-${fieldName}-${value}`}
                />
              </EuiToolTip>
            </div>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="s" />
    </>
  );
}
