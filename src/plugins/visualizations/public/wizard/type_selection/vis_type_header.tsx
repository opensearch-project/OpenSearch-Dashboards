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

import React from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { VisTypeAlias } from '../../vis_types/vis_type_alias_registry';

export interface VisTypeHeaderProps {
  promotedVisTypes: VisTypeAlias[];
  onVisTypeSelected: (visType: VisTypeAlias) => void;
}

export function VisTypeHeader(props: VisTypeHeaderProps) {
  return (
    <React.Fragment>
      <EuiModalHeader>
        <EuiFlexGroup direction="column" gutterSize="m">
          <EuiFlexItem>
            <EuiModalHeaderTitle>
              <FormattedMessage
                id="visualizations.newVisWizard.title"
                defaultMessage="New Visualization"
              />
            </EuiModalHeaderTitle>
          </EuiFlexItem>
          {props.promotedVisTypes.map((type) => (
            <EuiFlexItem>
              <EuiCallOut
                title={
                  type.promotion?.title &&
                  i18n.translate(`visualize.promotion.${type.name}.title`, {
                    defaultMessage: type.promotion?.title,
                  })
                }
                iconType={type.icon}
                heading="h2"
              >
                <EuiFlexGroup justifyContent="spaceBetween" wrap={true}>
                  <EuiFlexItem grow={false}>
                    <FormattedMessage
                      id={`visualize.promotion.${type.name}.description`}
                      defaultMessage={type.promotion?.description}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      onClick={() => props.onVisTypeSelected(type)}
                      data-test-subj={`visualize.promotion.${type.name}.button`}
                      size="s"
                    >
                      {type.promotion?.buttonText}
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiCallOut>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiModalHeader>
    </React.Fragment>
  );
}
