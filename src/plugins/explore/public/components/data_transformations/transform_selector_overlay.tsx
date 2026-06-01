/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import {
  EuiButton,
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
import { ITransformationService } from './types';

interface TransformSelectorButtonProps {
  transformationService: ITransformationService;
  onSelectTransformation: (id: string) => void;
}

export const TransformSelectorButton = ({
  transformationService,
  onSelectTransformation,
}: TransformSelectorButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const closeFlyout = () => {
    setIsOpen(false);
    setSearchText('');
  };

  const handleSelect = (id: string) => {
    onSelectTransformation(id);
    closeFlyout();
  };

  const allMethods = useMemo(() => {
    return transformationService.getDefinitions();
  }, [transformationService]);
  const filtered = allMethods.filter((m) =>
    m.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      <EuiButton
        size="s"
        iconType="plus"
        onClick={() => setIsOpen(true)}
        data-test-subj="transformPanelAddButton"
      >
        {i18n.translate('explore.transformPanel.addButton', { defaultMessage: 'Add' })}
      </EuiButton>

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
                {i18n.translate('explore.transformSelectorPanelFlyout.title', {
                  defaultMessage: 'Add Transformation',
                })}
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>

          <EuiFlyoutBody>
            <EuiFieldSearch
              placeholder={i18n.translate(
                'explore.transformSelectorPanelFlyout.searchPlaceholder',
                {
                  defaultMessage: 'Search transformations...',
                }
              )}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              fullWidth
            />
            <EuiSpacer size="m" />

            {filtered.length > 0 ? (
              <EuiFlexGroup wrap gutterSize="m" direction="column">
                {filtered.map((method) => (
                  <EuiFlexItem key={method.id} grow={false}>
                    <EuiCard
                      layout="horizontal"
                      icon={<EuiIcon type={method.iconType} size="m" />}
                      title={method.label}
                      description={method.description}
                      titleSize="xs"
                      onClick={() => handleSelect(method.id)}
                      data-test-subj={`transformMethodCard-${method.id}`}
                    />
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            ) : (
              <EuiText size="s" color="subdued" textAlign="center">
                <p>
                  {i18n.translate('explore.transformSelector.noResults', {
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
