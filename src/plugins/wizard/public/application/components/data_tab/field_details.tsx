/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButton, EuiIconTip, EuiLink, EuiPopoverFooter, EuiSpacer, EuiText } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { IndexPatternField } from 'src/plugins/data/public';
import { IndexPattern } from 'src/plugins/data/common';
import { WizardFieldBucket } from './field_bucket';
import { getWarnings } from './lib/get_warnings';
// import {
//   getVisualizeHref,
//   isFieldVisualizable,
//   triggerVisualizeActions,
// } from './lib/visualize_trigger_utils';
import { Bucket, FieldDetails } from './types';

import './field_details.scss';

interface FieldDetailsProps {
  field: IndexPatternField;
  indexPattern: IndexPattern | null;
  details: FieldDetails;
}

export function WizardFieldDetails({ field, indexPattern, details }: FieldDetailsProps) {
  const warnings = getWarnings(field);
  const [showVisualizeLink] = useState<boolean>(false);
  const [visualizeLink] = useState<string>('');

  // useEffect(() => {
  //   isFieldVisualizable(field, indexPattern?.id, details.columns).then(
  //     (flag) => {
  //       setShowVisualizeLink(flag);
  //       // get href only if Visualize button is enabled
  //       getVisualizeHref(field, indexPattern?.id, details.columns).then(
  //         (uri) => {
  //           if (uri) setVisualizeLink(uri);
  //         },
  //         () => {
  //           setVisualizeLink('');
  //         }
  //       );
  //     },
  //     () => {
  //       setShowVisualizeLink(false);
  //     }
  //   );
  // }, [field, indexPattern?.id, details.columns]);
  //
  // const handleVisualizeLinkClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
  //   // regular link click. let the uiActions code handle the navigation and show popup if needed
  //   event.preventDefault();
  //   triggerVisualizeActions(field, indexPattern?.id, details.columns);
  // };

  return (
    <>
      <div className="wizardFieldDetails">
        {details.error && <EuiText size="xs">{details.error}</EuiText>}
        {!details.error && (
          <div style={{ marginTop: '4px' }}>
            {details.buckets.map((bucket: Bucket, idx: number) => (
              <WizardFieldBucket key={`bucket${idx}`} bucket={bucket} field={field} />
            ))}
          </div>
        )}

        {showVisualizeLink && (
          <>
            <EuiSpacer size="xs" />
            {/* eslint-disable-next-line @elastic/eui/href-or-on-click */}
            <EuiButton
              onClick={() => {}}
              // onClick={(e) => handleVisualizeLinkClick(e)}
              href={visualizeLink}
              size="s"
              className="wizFieldDetails__visualizeBtn"
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
          </>
        )}
      </div>
      {!details.error && (
        <EuiPopoverFooter>
          <EuiText size="xs" textAlign="center">
            {!indexPattern?.metaFields.includes(field.name) && !field.scripted ? (
              <EuiLink onClick={() => {}}>
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
