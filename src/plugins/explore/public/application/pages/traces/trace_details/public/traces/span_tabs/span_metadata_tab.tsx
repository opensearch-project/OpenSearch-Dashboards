/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { EuiText, EuiSpacer, EuiAccordion, EuiHorizontalRule } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { isEmpty } from '../../utils/helper_functions';
import { formatSpanAttributes, sortAttributes } from '../../utils/span_data_utils';
import { FlyoutListItem } from '../flyout_list_item';

export interface SpanMetadataTabProps {
  selectedSpan?: any;
  addSpanFilter: (field: string, value: any) => void;
}

interface CategorizedAttributes {
  http: Array<[string, any]>;
  infrastructure: Array<[string, any]>;
  application: Array<[string, any]>;
  general: Array<[string, any]>;
}

export const SpanMetadataTab: React.FC<SpanMetadataTabProps> = ({
  selectedSpan,
  addSpanFilter,
}) => {
  const categorizedAttributes = useMemo(() => {
    if (!selectedSpan || isEmpty(selectedSpan)) {
      return null;
    }

    const attributes = formatSpanAttributes(selectedSpan);
    const sortedAttributes = sortAttributes(attributes);

    const categorized: CategorizedAttributes = {
      http: [],
      infrastructure: [],
      application: [],
      general: [],
    };

    sortedAttributes.forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();

      if (
        lowerKey.includes('http') ||
        lowerKey.includes('url') ||
        lowerKey.includes('method') ||
        lowerKey.includes('status_code') ||
        lowerKey.includes('user_agent') ||
        lowerKey.includes('request') ||
        lowerKey.includes('response')
      ) {
        categorized.http.push([key, value]);
      } else if (
        lowerKey.includes('aws') ||
        lowerKey.includes('ec2') ||
        lowerKey.includes('cloud') ||
        lowerKey.includes('host') ||
        lowerKey.includes('availability') ||
        lowerKey.includes('region') ||
        lowerKey.includes('k8s') ||
        lowerKey.includes('kubernetes') ||
        lowerKey.includes('pod') ||
        lowerKey.includes('container') ||
        lowerKey.includes('namespace') ||
        lowerKey.includes('cluster')
      ) {
        categorized.infrastructure.push([key, value]);
      } else if (
        lowerKey.includes('app') ||
        lowerKey.includes('service') ||
        lowerKey.includes('version') ||
        lowerKey.includes('platform') ||
        lowerKey.includes('code') ||
        lowerKey.includes('thread') ||
        lowerKey.includes('function')
      ) {
        categorized.application.push([key, value]);
      } else {
        categorized.general.push([key, value]);
      }
    });

    return categorized;
  }, [selectedSpan]);

  const renderAttributeList = (attributes: Array<[string, any]>) => {
    return attributes.map(([key, value]) => {
      const _isEmpty = (val: any) => {
        return (
          val == null ||
          (val.hasOwnProperty('length') && val.length === 0) ||
          (val.constructor === Object && Object.keys(val).length === 0)
        );
      };

      // Create a clean display name by removing prefixes
      const getDisplayName = (fullKey: string): string => {
        if (fullKey.startsWith('attributes.')) {
          return fullKey.replace('attributes.', '');
        }
        if (fullKey.startsWith('resource.attributes.')) {
          return fullKey.replace('resource.attributes.', '');
        }
        return fullKey;
      };

      const displayName = getDisplayName(key);

      if (_isEmpty(value)) {
        return (
          <FlyoutListItem
            key={`attribute-${key}`}
            title={displayName}
            description="-"
            addSpanFilter={() => addSpanFilter(key, value)}
          />
        );
      }

      let displayValue = value;
      if (typeof value === 'object') {
        displayValue = JSON.stringify(value);
      }

      return (
        <FlyoutListItem
          key={`attribute-${key}`}
          title={displayName}
          description={displayValue}
          addSpanFilter={() => addSpanFilter(key, value)}
        />
      );
    });
  };

  const renderSection = (
    title: string,
    attributes: Array<[string, any]>,
    defaultOpen: boolean = true
  ) => {
    if (attributes.length === 0) return null;

    return (
      <>
        <EuiAccordion
          id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          buttonContent={
            <EuiText size="m" color="default">
              <span>
                <strong>{title}</strong>
              </span>
            </EuiText>
          }
          initialIsOpen={defaultOpen}
          paddingSize="none"
        >
          <EuiSpacer size="s" />
          {renderAttributeList(attributes)}
        </EuiAccordion>
        <EuiHorizontalRule margin="xs" />
      </>
    );
  };

  if (!selectedSpan || isEmpty(selectedSpan)) {
    return (
      <EuiText color="subdued" textAlign="center">
        {i18n.translate('explore.spanMetadataTab.noSpanSelected', {
          defaultMessage: 'No span selected',
        })}
      </EuiText>
    );
  }

  if (
    !categorizedAttributes ||
    Object.values(categorizedAttributes).every((attrs) => attrs.length === 0)
  ) {
    return (
      <EuiText color="subdued" textAlign="center">
        {i18n.translate('explore.spanMetadataTab.noAttributes', {
          defaultMessage: 'No metadata attributes found for this span',
        })}
      </EuiText>
    );
  }

  return (
    <>
      {renderSection(
        i18n.translate('explore.spanMetadataTab.section.http', {
          defaultMessage: 'HTTP',
        }),
        categorizedAttributes.http
      )}

      {renderSection(
        i18n.translate('explore.spanMetadataTab.section.infrastructure', {
          defaultMessage: 'Infrastructure',
        }),
        categorizedAttributes.infrastructure
      )}

      {renderSection(
        i18n.translate('explore.spanMetadataTab.section.application', {
          defaultMessage: 'Application',
        }),
        categorizedAttributes.application
      )}

      {renderSection(
        i18n.translate('explore.spanMetadataTab.section.attributes', {
          defaultMessage: 'Attributes',
        }),
        categorizedAttributes.general
      )}
    </>
  );
};
