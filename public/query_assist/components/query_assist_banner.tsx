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
import { QueryEditorExtensionDependencies } from '../../../../../src/plugins/data/public/ui/query_editor/query_editor_extensions/query_editor_extension';
import { SUPPORTED_LANGUAGES } from '../../../common/query_assist';
import assistantLogo from '../../assets/query_assist_logo.svg';
import { getStorage } from '../../services';

const BANNER_STORAGE_KEY = 'queryAssist:banner:show';

interface QueryAssistBannerProps {
  dependencies: QueryEditorExtensionDependencies;
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

  if (!showCallOut || storage.get(BANNER_STORAGE_KEY) === false) return null;

  return (
    <EuiCallOut
      size="s"
      title={
        <EuiFlexGroup responsive={false} gutterSize="s" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiIcon size="l" type={assistantLogo} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge>
              <FormattedMessage id="queryAssist.banner.badge" defaultMessage="New!" />
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTextColor color="default">
              <FormattedMessage
                id="queryAssist.banner.title.prefix"
                defaultMessage="Use natural language to explore your data with "
              />
              <EuiLink>
                <FormattedMessage
                  id="queryAssist.banner.title.suffix"
                  defaultMessage="Natural Language Query Generation for {languages}"
                  values={{ languages: SUPPORTED_LANGUAGES.join(', ') }}
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
