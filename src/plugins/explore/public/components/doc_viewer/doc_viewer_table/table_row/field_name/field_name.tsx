/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { FieldIconProps, FieldIcon } from '../../../../../../../opensearch_dashboards_react/public';
import { shortenDottedString } from '../../../../../helpers/shorten_dotted_string';
import { getFieldTypeName } from './field_type_name';

// properties fieldType and fieldName are provided in osd_doc_view
// this should be changed when both components are deangularized
interface Props {
  fieldName: string;
  fieldType: string;
  useShortDots?: boolean;
  fieldIconProps?: Omit<FieldIconProps, 'type'>;
  scripted?: boolean;
}

export function FieldName({
  fieldName,
  fieldType,
  useShortDots,
  fieldIconProps,
  scripted = false,
}: Props) {
  const typeName = getFieldTypeName(fieldType);
  const displayName = useShortDots ? shortenDottedString(fieldName) : fieldName;

  return (
    <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
      <EuiFlexItem grow={false}>
        <FieldIcon type={fieldType} label={typeName} scripted={scripted} {...fieldIconProps} />
      </EuiFlexItem>
      <EuiFlexItem className="eui-textTruncate">
        <EuiToolTip
          position="top"
          content={displayName}
          delay="long"
          anchorClassName="eui-textTruncate"
        >
          <span>{displayName}</span>
        </EuiToolTip>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
