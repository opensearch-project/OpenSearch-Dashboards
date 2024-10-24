/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { CoreSetup, DocLinksStart } from '../../../../core/public';
import { DEFAULT_DATA } from '../../../data/common';
import { DataPublicPluginSetup } from '../../../data/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';

interface FieldTypeToleranceInfoIconProps {
  core: CoreSetup;
  data: DataPublicPluginSetup;
}

const SQL_ARRAY_INFO_FOOTER_STORAGE_KEY = 'queryEnhancements:sqlArrayInfoAcknowledged';
const FIELD_TYPE_TOLERANCE_SETTING_KEY = 'plugins.query.field_type_tolerance';

const fieldTypeToleranceEnabledByDataSource: Map<string | undefined, boolean> = new Map();

/**
 * Info icon to be added in query editor footer to notify user about SQL/PPL
 * field type tolerance. The icon should only be visible if field type
 * tolerance is unset or set to false, and the selected datasource is
 * OpenSearch Cluster. External datasources like S3 are not affected.
 */
export const FieldTypeToleranceInfoIcon: React.FC<FieldTypeToleranceInfoIconProps> = (props) => {
  const { services } = useOpenSearchDashboards<{ docLinks: DocLinksStart }>();
  const [isHidden, setIsHidden] = useState(true);
  const [isPopoverOpen, _setIsPopoverOpen] = useState(false);
  const setIsPopoverOpen: typeof _setIsPopoverOpen = (isOpen) => {
    if (!isOpen) {
      window.localStorage.setItem(SQL_ARRAY_INFO_FOOTER_STORAGE_KEY, 'true');
    }
    _setIsPopoverOpen(isOpen);
  };

  useEffectOnce(() => {
    const query = props.data.query.queryString.getQuery();
    if (
      query.dataset?.dataSource?.type !== DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH && // datasource is not MDS OpenSearch
      query.dataset?.dataSource?.type !== 'DATA_SOURCE' && // datasource is not MDS OpenSearch when using indexes
      query.dataset?.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN // dataset is not index pattern
    )
      return;

    (async () => {
      const dataSourceId = query.dataset?.dataSource?.id || undefined;
      let isFieldTypeToleranceEnabled = fieldTypeToleranceEnabledByDataSource.get(dataSourceId);
      if (isFieldTypeToleranceEnabled === undefined) {
        isFieldTypeToleranceEnabled = await props.core.http
          .post('/api/console/proxy', {
            query: { path: '_cluster/settings?flat_settings=true', method: 'GET', dataSourceId },
          })
          .then(
            (settings) =>
              !!(
                settings.persistent[FIELD_TYPE_TOLERANCE_SETTING_KEY] === 'true' ||
                settings.transient[FIELD_TYPE_TOLERANCE_SETTING_KEY] === 'true'
              )
          )
          .catch(() => true);
        if (isFieldTypeToleranceEnabled === false) {
          setIsHidden(false);
          if (window.localStorage.getItem(SQL_ARRAY_INFO_FOOTER_STORAGE_KEY) !== 'true') {
            // open popover after button rendering to position it correctly
            setTimeout(() => setIsPopoverOpen(true), 1000);
          }
        }
      }
    })();
  });

  if (isHidden) return null;

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          aria-label={i18n.translate('queryEnhancements.sqlArrayInfo.buttonIcon.ariaLabel', {
            defaultMessage: 'Toggle field type tolerance information',
          })}
          iconType="iInCircle"
          color="text"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        />
      }
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      panelClassName="queryEnhancements"
    >
      <EuiText size="s" className="sqlArrayInfoPopoverText">
        <h4>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiIcon type="iInCircle" />
            </EuiFlexItem>
            <EuiFlexItem>
              <FormattedMessage
                id="queryEnhancements.sqlArrayInfo.title"
                defaultMessage="No array datatype support"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </h4>
        <p>
          <FormattedMessage
            id="queryEnhancements.sqlArrayInfo.message"
            defaultMessage="Only the first element of multiple field values will be returned. "
          />
          <EuiLink href={services.docLinks.links.noDocumentation.sql.limitation} target="_blank">
            <FormattedMessage
              id="queryEnhancements.sqlArrayInfo.learnMore"
              defaultMessage="Learn more"
            />
          </EuiLink>
        </p>
      </EuiText>
    </EuiPopover>
  );
};
