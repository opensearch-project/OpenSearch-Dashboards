/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, useEffect } from 'react';
import { EuiLink, EuiIconTip, EuiText, EuiPopoverFooter, EuiButton, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { DiscoverFieldBucket } from './discover_field_bucket';
import { getWarnings } from './lib/get_warnings';
import {
  triggerVisualizeActions,
  isFieldVisualizable,
  getVisualizeHref,
} from './lib/visualize_trigger_utils';
import { Bucket, FieldDetails } from './types';
import { IndexPatternField, IndexPattern } from '../../../../../data/public';

interface DiscoverFieldDetailsProps {
  columns: string[];
  details: FieldDetails;
  field: IndexPatternField;
  indexPattern: IndexPattern;
  onAddFilter: (field: IndexPatternField | string, value: string, type: '+' | '-') => void;
}

export function DiscoverFieldDetails({
  columns,
  details,
  field,
  indexPattern,
  onAddFilter,
}: DiscoverFieldDetailsProps) {
  const warnings = getWarnings(field);
  const [showVisualizeLink, setShowVisualizeLink] = useState<boolean>(false);
  const [visualizeLink, setVisualizeLink] = useState<string>('');

  useEffect(() => {
    const checkIfVisualizable = async () => {
      const visualizable = await isFieldVisualizable(field, indexPattern.id, columns).catch(
        () => false
      );

      setShowVisualizeLink(visualizable);
      if (visualizable) {
        const href = await getVisualizeHref(field, indexPattern.id, columns).catch(() => '');
        setVisualizeLink(href || '');
      }
    };
    checkIfVisualizable();
  }, [field, indexPattern.id, columns]);

  const handleVisualizeLinkClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // regular link click. let the uiActions code handle the navigation and show popup if needed
    event.preventDefault();
    triggerVisualizeActions(field, indexPattern.id, columns);
  };

  return (
    <>
      <div className="dscFieldDetails" data-test-subj={`fieldVisualizeContainer`}>
        {details.error && (
          <EuiText size="xs" data-test-subj={`fieldVisualizeError`}>
            {details.error}
          </EuiText>
        )}

        {!details.error && details.buckets.length > 0 && (
          <div style={{ marginTop: '4px' }} data-test-subj={`fieldVisualizeBucketContainer`}>
            {details.buckets.map((bucket: Bucket, idx: number) => (
              <DiscoverFieldBucket
                key={`bucket${idx}`}
                bucket={bucket}
                field={field}
                onAddFilter={onAddFilter}
              />
            ))}
          </div>
        )}

        {showVisualizeLink && visualizeLink && (
          <div data-test-subj={`fieldVisualizeLink`}>
            <EuiSpacer size="xs" />
            {/* eslint-disable-next-line @elastic/eui/href-or-on-click */}
            <EuiButton
              onClick={(e) => handleVisualizeLinkClick(e)}
              href={visualizeLink}
              size="s"
              className="dscFieldDetails__visualizeBtn"
              data-test-subj={`fieldVisualize-${field.name}`}
            >
              <FormattedMessage
                id="discover.fieldChooser.detailViews.visualizeLinkText"
                defaultMessage="Visualize"
              />
            </EuiButton>
            {warnings.length > 0 && (
              <EuiIconTip type="alert" color="warning" content={warnings.join(' ')} />
            )}
          </div>
        )}
      </div>
      {!details.error && (
        <EuiPopoverFooter>
          <EuiText size="xs" textAlign="center">
            {!indexPattern.metaFields.includes(field.name) && !field.scripted ? (
              <EuiLink onClick={() => onAddFilter('_exists_', field.name, '+')}>
                <FormattedMessage
                  id="discover.fieldChooser.detailViews.existsText"
                  defaultMessage="Exists in"
                />{' '}
                {details.exists}
              </EuiLink>
            ) : (
              <span>{details.exists}</span>
            )}{' '}
            / {details.total}{' '}
            <FormattedMessage
              id="discover.fieldChooser.detailViews.recordsText"
              defaultMessage="records"
            />
          </EuiText>
        </EuiPopoverFooter>
      )}
    </>
  );
}
