/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiTextColor,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState } from 'react';
import { QueryEditorExtensionDependencies } from '../../../../data/public';
import assistantMark from '../../assets/sparkle_mark.svg';
import { getStorage } from '../../services';

const BANNER_STORAGE_KEY = 'queryAssist:banner:show';

interface QueryAssistBannerProps {
  dependencies: QueryEditorExtensionDependencies;
  languages: string[];
}

export const QueryAssistBanner: React.FC<QueryAssistBannerProps> = (props) => {
  const storage = getStorage();
  const [showCallOut, _setShowCallOut] = useState(true);
  const setShowCallOut: typeof _setShowCallOut = (show) => {
    if (!show) {
      storage.set(BANNER_STORAGE_KEY, false);
    }
    _setShowCallOut(show);
  };

  if (!showCallOut || storage.get(BANNER_STORAGE_KEY) === false || props.languages.length === 0)
    return null;

  return (
    <EuiCallOut
      className="queryAssist"
      size="s"
      title={
        <EuiFlexGroup responsive={false} gutterSize="s" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiIcon size="l" type={assistantMark} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge>
              <FormattedMessage id="queryEnhancements.banner.badge" defaultMessage="New!" />
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTextColor color="default">
              <FormattedMessage
                id="queryEnhancements.banner.title.prefix"
                defaultMessage="Use natural language to explore your data with "
              />
              <EuiLink
                data-test-subj="queryAssist-banner-changeLanguage"
                onClick={() => {
                  props.dependencies.onSelectLanguage(props.languages[0]);
                  if (props.dependencies.isCollapsed) props.dependencies.setIsCollapsed(false);
                }}
              >
                <FormattedMessage
                  id="queryEnhancements.banner.title.suffix"
                  defaultMessage="Natural Language Query Generation for {languages}"
                  values={{ languages: props.languages.join(', ') }}
                />
              </EuiLink>
            </EuiTextColor>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
      dismissible
      onDismiss={() => setShowCallOut(false)}
    />
  );
};
