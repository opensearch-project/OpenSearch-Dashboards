/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLink, EuiPopoverFooter, EuiPopoverTitle, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { IndexPatternField } from '../../../../../data/public';

import { VisBuilderFieldBucket } from './field_bucket';
import { Bucket, FieldDetails } from './types';

interface FieldDetailsProps {
  field: IndexPatternField;
  isMetaField: boolean;
  details: FieldDetails;
  onAddFilter: (field: IndexPatternField | string, value: string, type: '+' | '-') => void;
}

export function VisBuilderFieldDetails({
  field,
  isMetaField,
  details,
  onAddFilter,
}: FieldDetailsProps) {
  const { buckets, error, exists, total } = details;

  const bucketsTitle =
    buckets.length > 1
      ? i18n.translate('visBuilder.fieldChooser.detailViews.fieldTopValuesLabel', {
          defaultMessage: 'Top {n} values',
          values: { n: buckets.length },
        })
      : i18n.translate('visBuilder.fieldChooser.detailViews.fieldTopValueLabel', {
          defaultMessage: 'Top value',
        });
  const errorTitle = i18n.translate('visBuilder.fieldChooser.detailViews.fieldNoValuesLabel', {
    defaultMessage: 'No values found',
  });
  const existsIn = i18n.translate('visBuilder.fieldChooser.detailViews.fieldExistsIn', {
    defaultMessage: 'Exists in {exists}',
    values: { exists },
  });
  const totalRecords = i18n.translate('visBuilder.fieldChooser.detailViews.fieldTotalRecords', {
    defaultMessage: '/ {total} records',
    values: { total },
  });

  const title = buckets.length ? bucketsTitle : errorTitle;

  const shouldAllowExistsFilter = !isMetaField && !field.scripted;

  return (
    <>
      <EuiPopoverTitle>{title}</EuiPopoverTitle>
      <div className="vbFieldDetails" data-test-subj="fieldDetailsContainer">
        {error ? (
          <EuiText size="xs" data-test-subj="fieldDetailsError">
            {error}
          </EuiText>
        ) : (
          <div
            className="vbFieldDetails__bucketsContainer"
            data-test-subj="fieldDetailsBucketsContainer"
          >
            {buckets.map((bucket: Bucket, idx: number) => (
              <VisBuilderFieldBucket
                key={`bucket${idx}`}
                bucket={bucket}
                field={field}
                onAddFilter={onAddFilter}
              />
            ))}
          </div>
        )}
      </div>
      {!error && (
        <EuiPopoverFooter>
          <EuiText size="xs" textAlign="center">
            {shouldAllowExistsFilter ? (
              <EuiLink
                onClick={() => onAddFilter('_exists_', field.name, '+')}
                data-test-subj="fieldDetailsExistsLink"
              >
                {existsIn}
              </EuiLink>
            ) : (
              <>{exists}</>
            )}{' '}
            {totalRecords}
          </EuiText>
        </EuiPopoverFooter>
      )}
    </>
  );
}
