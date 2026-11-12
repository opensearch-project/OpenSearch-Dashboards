/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import {
  EuiButtonIcon,
  EuiCard,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TransformationDefinition } from '../../../../components/data_transformations';
import './query_workspace.scss';

export const TransformationAddButton = ({
  definitions,
  onSelectTransformation,
}: {
  definitions: TransformationDefinition[];
  onSelectTransformation: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const closeFlyout = () => {
    setIsOpen(false);
    setSearchText('');
  };

  const filteredDefinitions = useMemo(
    () =>
      definitions.filter((definition) =>
        definition.label.toLowerCase().includes(searchText.toLowerCase())
      ),
    [definitions, searchText]
  );

  return (
    <>
      <EuiButtonIcon
        iconType="plus"
        color="text"
        aria-label={i18n.translate('explore.queryWorkspace.addTransformationAriaLabel', {
          defaultMessage: 'Add transformation',
        })}
        onClick={() => setIsOpen(true)}
        className="queryWorkspaceSection__addButton"
        data-test-subj="queryWorkspaceAddTransformationButton"
      />

      {isOpen && (
        <EuiFlyout
          ownFocus
          onClose={closeFlyout}
          size="s"
          side="right"
          data-test-subj="transformSelectorPanelFlyout"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>
                {i18n.translate('explore.queryWorkspace.transformSelectorTitle', {
                  defaultMessage: 'Add Transformation',
                })}
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>

          <EuiFlyoutBody>
            <EuiFieldSearch
              placeholder={i18n.translate('explore.queryWorkspace.transformSearchPlaceholder', {
                defaultMessage: 'Search transformations...',
              })}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              fullWidth
            />
            <EuiSpacer size="m" />

            {filteredDefinitions.length > 0 ? (
              <EuiFlexGroup wrap gutterSize="m" direction="column">
                {filteredDefinitions.map((definition) => (
                  <EuiFlexItem key={definition.id} grow={false}>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon type={definition.iconType} size="m" />}
                      title={definition.label}
                      description={definition.description}
                      titleSize="xs"
                      onClick={() => {
                        onSelectTransformation(definition.id);
                        closeFlyout();
                      }}
                      data-test-subj={`transformMethodCard-${definition.id}`}
                    />
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            ) : (
              <EuiText size="s" color="subdued" textAlign="center">
                <p>
                  {i18n.translate('explore.queryWorkspace.transformSearchNoResults', {
                    defaultMessage: 'No transformations found.',
                  })}
                </p>
              </EuiText>
            )}
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
