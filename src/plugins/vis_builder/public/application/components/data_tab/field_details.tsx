/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLink, EuiPopoverFooter, EuiPopoverTitle, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { IndexPatternField } from '../../../../../data/public';

import { useIndexPatterns, useOnAddFilter } from '../../utils/use';
import { FieldBucket } from './field_bucket';
import { Bucket, FieldDetails } from './types';

interface FieldDetailsProps {
  field: IndexPatternField;
  details: FieldDetails;
}

export function FieldDetailsView({ field, details }: FieldDetailsProps) {
  const { buckets, error, exists, total } = details;

  const onAddFilter = useOnAddFilter();
  const indexPattern = useIndexPatterns().selected;

  const { metaFields = [] } = indexPattern ?? {};
  const isMetaField = metaFields.includes(field.name);
  const shouldAllowExistsFilter = !isMetaField && !field.scripted;

  const bucketsTitle =
    buckets.length > 1
      ? i18n.translate('visBuilder.fieldSelector.detailsView.fieldTopValuesLabel', {
          defaultMessage: 'Top {n} values',
          values: { n: buckets.length },
        })
      : i18n.translate('visBuilder.fieldSelector.detailsView.fieldTopValueLabel', {
          defaultMessage: 'Top value',
        });
  const errorTitle = i18n.translate('visBuilder.fieldSelector.detailsView.fieldNoValuesLabel', {
    defaultMessage: 'No values found',
  });
  const existsIn = i18n.translate('visBuilder.fieldSelector.detailsView.fieldExistsIn', {
    defaultMessage: 'Exists in {exists}',
    values: { exists },
  });
  const totalRecords = i18n.translate('visBuilder.fieldSelector.detailsView.fieldTotalRecords', {
    defaultMessage: '/ {total} records',
    values: { total },
  });

  const title = buckets.length ? bucketsTitle : errorTitle;

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
              <FieldBucket key={`bucket${idx}`} bucket={bucket} field={field} />
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
