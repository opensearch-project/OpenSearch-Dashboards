/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useState } from 'react';
import {
  EuiFlexItem,
  EuiText,
  slugify,
  EuiTitle,
  EuiSpacer,
  EuiFlexGrid,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalHeaderTitle,
  EuiModalFooter,
  EuiButton,
  EuiFlexGroup,
  EuiPanel,
  EuiSelectable,
  EuiSelectableOption,
} from '@elastic/eui';
import { WorkspaceOverviewCard, WorkspaceOverviewCardProps } from './getting_start_card';
import { GetStartCard } from './types';
import './index.scss';

export interface WorkspaceOverviewGettingStartModalProps
  extends Omit<WorkspaceOverviewCardProps, 'card'> {
  onCloseModal: () => void;
  availableCards: GetStartCard[];
}

export const WorkspaceOverviewGettingStartModal = (
  props: WorkspaceOverviewGettingStartModalProps
) => {
  const ALL = 'All';
  const [selectedItemName, setSelectedItem] = useState(ALL);
  const { onCloseModal, availableCards } = props;

  const categories: string[] = [
    ...new Set(
      availableCards.map((card) => {
        return card?.category?.label || ALL;
      })
    ),
  ];

  const options: EuiSelectableOption[] = [ALL, ...categories].map((category) => {
    return {
      label: category,
      checked: selectedItemName === category ? 'on' : undefined,
      className: 'gettingStartCategoryItem',
    };
  });

  const categorySelection = (
    <EuiSelectable
      data-test-subj="category_single_selection"
      aria-label="category selection"
      className="gettingStartCategory"
      options={options}
      onChange={(newOptions) => {
        const selectedOption = newOptions.find((option) => option.checked === 'on');
        setSelectedItem(selectedOption?.label || ALL);
      }}
      singleSelection={true}
      listProps={{
        bordered: false,
        rowHeight: 48,
        onFocusBadge: false,
        windowProps: {
          className: 'gettingStartCategoryItemList',
        },
      }}
    >
      {(list) => {
        return list;
      }}
    </EuiSelectable>
  );

  const cardList: ReactNode[] = categories
    .filter((category) => category === selectedItemName || selectedItemName === ALL)
    .map((category) => {
      const cards = availableCards.filter((card) => {
        return card.category?.label === category;
      });

      return (
        <div id={slugify(category)} key={slugify(category)}>
          <EuiTitle>
            <h3>{category}</h3>
          </EuiTitle>
          <EuiSpacer />
          <EuiFlexGrid columns={4}>
            {cards.map((card) => {
              return (
                <EuiFlexItem key={card.featureName}>
                  <WorkspaceOverviewCard {...props} card={card} />
                </EuiFlexItem>
              );
            })}
          </EuiFlexGrid>
          <EuiSpacer size="m" />
        </div>
      );
    });

  return (
    <EuiModal onClose={onCloseModal} maxWidth={false} className="gettingStartModel">
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h2>Define your path forward</h2>
          <EuiText color="subdued">Discover tailored solutions for your unique objectives</EuiText>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem key="category_selection" grow={2}>
            {categorySelection}
          </EuiFlexItem>
          <EuiFlexItem key="cards_content" grow={10} style={{ margin: '0px' }}>
            <EuiPanel color="subdued" className="gettingStartModel_body" grow={false}>
              {cardList}
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButton data-test-subj="close" onClick={onCloseModal}>
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
