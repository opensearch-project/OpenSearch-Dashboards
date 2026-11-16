/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  EuiButton,
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
import {
  COMBINE_TRANSFORMATION_TYPE,
  TransformationDefinition,
} from '../../../../components/data_transformations';
import './query_workspace.scss';

type TransformationCategory = 'all' | 'combine' | 'transform';

const CATEGORY_OPTIONS: Array<{ id: TransformationCategory; label: string }> = [
  {
    id: 'all',
    label: i18n.translate('explore.queryWorkspace.transformCategoryAll', {
      defaultMessage: 'View all',
    }),
  },
  {
    id: 'combine',
    label: i18n.translate('explore.queryWorkspace.transformCategoryCombine', {
      defaultMessage: 'Combine',
    }),
  },
  {
    id: 'transform',
    label: i18n.translate('explore.queryWorkspace.transformCategoryTransform', {
      defaultMessage: 'Transform data',
    }),
  },
];

export const TransformationAddButton = ({
  definitions,
  onSelectTransformation,
}: {
  definitions: TransformationDefinition[];
  onSelectTransformation: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [category, setCategory] = useState<TransformationCategory>('all');

  const closeFlyout = () => {
    setIsOpen(false);
    setSearchText('');
    setCategory('all');
  };

  const filteredDefinitions = useMemo(
    () =>
      definitions.filter((definition) =>
        definition.label.toLowerCase().includes(searchText.toLowerCase())
      ),
    [definitions, searchText]
  );

  // Steps that combine queries first, then the ones that change each query's data.
  const groups = useMemo(
    () =>
      [
        {
          id: 'combine',
          title: i18n.translate('explore.queryWorkspace.transformGroupCombine', {
            defaultMessage: 'Combine queries',
          }),
          items: filteredDefinitions.filter((d) => d.type === COMBINE_TRANSFORMATION_TYPE),
        },
        {
          id: 'transform',
          title: i18n.translate('explore.queryWorkspace.transformGroupTransform', {
            defaultMessage: 'Transform data',
          }),
          items: filteredDefinitions.filter((d) => d.type !== COMBINE_TRANSFORMATION_TYPE),
        },
      ].filter(({ id, items }) => (category === 'all' || category === id) && items.length > 0),
    [filteredDefinitions, category]
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
            <EuiFlexGroup gutterSize="s" wrap responsive={false}>
              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = option.id === category;
                return (
                  <EuiFlexItem key={option.id} grow={false}>
                    <EuiButton
                      size="s"
                      fill={isSelected}
                      color={isSelected ? 'primary' : 'text'}
                      iconType={isSelected ? 'check' : undefined}
                      iconSide="right"
                      aria-pressed={isSelected}
                      onClick={() => setCategory(option.id)}
                      data-test-subj={`transformCategory-${option.id}`}
                    >
                      {option.label}
                    </EuiButton>
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGroup>
            <EuiSpacer size="m" />

            {groups.length > 0 ? (
              groups.map((group) => (
                <React.Fragment key={group.id}>
                  <EuiTitle size="xxs">
                    <h3 data-test-subj={`transformGroupTitle-${group.id}`}>{group.title}</h3>
                  </EuiTitle>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup wrap gutterSize="m" direction="column">
                    {group.items.map((definition) => (
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
                  <EuiSpacer size="m" />
                </React.Fragment>
              ))
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
