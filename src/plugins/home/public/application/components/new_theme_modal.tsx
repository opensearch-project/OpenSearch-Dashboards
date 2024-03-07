/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FC } from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage,
  EuiLink,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  RedirectAppLinks,
  useOpenSearchDashboards,
} from '../../../../../../src/plugins/opensearch_dashboards_react/public';

interface Props {
  addBasePath: (path: string) => string;
  onClose: () => void;
}

export const NewThemeModal: FC<Props> = ({ addBasePath, onClose }) => {
  const {
    services: { application },
  } = useOpenSearchDashboards<CoreStart>();

  return (
    <EuiModal onClose={onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <FormattedMessage
            id="home.newThemeModal.title"
            defaultMessage="Introducing new OpenSearch Dashboards look & feel"
          />
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <RedirectAppLinks application={application}>
          <EuiText>
            <FormattedMessage
              id="home.newThemeModal.previewDescription.previewDetail"
              defaultMessage="You are now previewing the newest OpenSearch Dashboards theme with improved light and dark
            modes. You or your administrator can change to the previous theme by visiting {advancedSettingsLink}."
              values={{
                advancedSettingsLink: (
                  <EuiLink
                    href={addBasePath('/app/management/opensearch-dashboards/settings#appearance')}
                  >
                    <FormattedMessage
                      id="home.newThemeModal.previewDescription.advancedSettingsLinkText"
                      defaultMessage="Advanced Settings"
                    />
                  </EuiLink>
                ),
              }}
            />
          </EuiText>
        </RedirectAppLinks>
        <EuiSpacer />
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiImage
              url={addBasePath('/plugins/home/assets/new_theme_light.png')}
              alt={i18n.translate('home.newThemeModal.lightModeImageAltDescription', {
                defaultMessage: 'screenshot of new theme in light mode',
              })}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiImage
              url={addBasePath('/plugins/home/assets/new_theme_dark.png')}
              alt={i18n.translate('home.newThemeModal.darkModeImageAltDescription', {
                defaultMessage: 'screenshot of new theme in dark mode',
              })}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={onClose} fill>
          <FormattedMessage id="home.newThemeModal.dismissButtonLabel" defaultMessage="Dismiss" />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
