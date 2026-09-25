/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { orderBy } from 'lodash';
import React, { ChangeEvent } from 'react';

import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCompressedFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiKeyPadMenu,
  EuiKeyPadMenuItem,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiScreenReaderOnly,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';

import { VisTypeAlias } from '../../vis_types/vis_type_alias_registry';
import { NewVisHelp } from './new_vis_help';
import { VisHelpText } from './vis_help_text';
import { VisTypeIcon } from './vis_type_icon';
import { VisType, TypesStart } from '../../vis_types';

interface VisTypeListEntry {
  type: VisType | VisTypeAlias;
  highlighted: boolean;
}

interface TypeSelectionProps {
  addBasePath: (path: string) => string;
  onVisTypeSelected: (visType: VisType | VisTypeAlias) => void;
  visTypesRegistry: TypesStart;
  showExperimental: boolean;
}

interface HighlightedType {
  name: string;
  title: string;
  description?: string;
  highlightMsg?: string;
}

interface TypeSelectionState {
  highlightedType: HighlightedType | null;
  isLegacyOpen: boolean;
  query: string;
}

interface VisTypeGroups {
  flatTypes: Array<VisType | VisTypeAlias>;
  legacyTypes: Array<VisType | VisTypeAlias>;
  recommendedTypes: VisTypeAlias[];
  workflowTypes: VisTypeAlias[];
}

type DescriptionMode = 'panel' | 'tooltip';

function isVisTypeAlias(type: VisType | VisTypeAlias): type is VisTypeAlias {
  return 'aliasPath' in type;
}

class TypeSelection extends React.Component<TypeSelectionProps, TypeSelectionState> {
  public state: TypeSelectionState = {
    highlightedType: null,
    isLegacyOpen: false,
    query: '',
  };

  public render() {
    const visTypeGroups = this.getVisTypeGroups(this.props.visTypesRegistry);
    const hasRecommendedTypes = visTypeGroups.recommendedTypes.length > 0;

    return (
      <React.Fragment>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiText size="s">
              <h2>
                <FormattedMessage
                  id="visualizations.newVisWizard.title"
                  defaultMessage="Create visualization"
                />
              </h2>
            </EuiText>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        {hasRecommendedTypes
          ? this.renderRecommendedSelection(visTypeGroups)
          : this.renderFlatSelection(visTypeGroups.flatTypes)}
      </React.Fragment>
    );
  }

  private renderRecommendedSelection({
    legacyTypes,
    recommendedTypes,
    workflowTypes,
  }: VisTypeGroups) {
    const { isLegacyOpen, query } = this.state;
    const filteredLegacyTypes = this.filterVisTypes(legacyTypes, query);

    return (
      <div className="visNewVisDialog__body visNewVisDialog__body--recommended">
        <div className="visNewVisDialog__recommendedTypes">
          {recommendedTypes.map(this.renderRecommendedType)}
        </div>

        {workflowTypes.length > 0 && (
          <EuiFlexGroup
            className="visNewVisDialog__workflows"
            alignItems="center"
            gutterSize="s"
            responsive
            wrap
          >
            <EuiFlexItem grow={false}>
              <EuiText size="s" color="subdued">
                <FormattedMessage
                  id="visualizations.newVisWizard.workflowPrompt"
                  defaultMessage="Or begin from a focused workflow:"
                />
              </EuiText>
            </EuiFlexItem>
            {workflowTypes.map((workflowType) => (
              <EuiFlexItem key={workflowType.name} grow={false}>
                <EuiButtonEmpty
                  size="s"
                  flush="left"
                  iconType="popout"
                  iconSide="right"
                  onClick={() => this.props.onVisTypeSelected(workflowType)}
                  data-test-subj={`workflowVisType-${workflowType.name}`}
                >
                  {workflowType.title}
                </EuiButtonEmpty>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        )}

        <EuiPanel
          className="visNewVisDialog__legacyPanel"
          color="plain"
          hasBorder
          hasShadow={false}
          paddingSize="none"
        >
          <EuiAccordion
            id="legacyVisualizationTypes"
            data-test-subj="legacyVisTypesAccordion"
            arrowDisplay="right"
            buttonClassName="visNewVisDialog__legacyAccordionButton"
            buttonContentClassName="visNewVisDialog__legacyAccordionButtonContent"
            buttonContent={
              <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                <EuiFlexItem grow={false}>
                  <div className="visNewVisDialog__optionIcon">
                    <VisTypeIcon icon="grid" />
                  </div>
                </EuiFlexItem>
                <EuiFlexItem className="visNewVisDialog__legacyText">
                  <EuiText size="s">
                    <strong>
                      <FormattedMessage
                        id="visualizations.newVisWizard.legacyTypesTitle"
                        defaultMessage="Classic visualization types"
                      />
                    </strong>
                  </EuiText>
                  <EuiText size="s" color="subdued">
                    <FormattedMessage
                      id="visualizations.newVisWizard.legacyTypesDescription"
                      defaultMessage="Use the classic editor for existing workflows and specialized chart types."
                    />
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem
                  className="visNewVisDialog__legacyTypeCount"
                  grow={false}
                  data-test-subj="legacyVisTypesCount"
                >
                  <EuiText size="xs" color="subdued">
                    <FormattedMessage
                      id="visualizations.newVisWizard.legacyTypesCount"
                      defaultMessage="{typeCount} {typeCount, plural, one {type} other {types}}"
                      values={{ typeCount: legacyTypes.length }}
                    />
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem
                  className="visNewVisDialog__legacyToggleLabel"
                  grow={false}
                  data-test-subj="legacyVisTypesToggleLabel"
                >
                  <EuiText size="xs" color="subdued">
                    {isLegacyOpen ? (
                      <FormattedMessage
                        id="visualizations.newVisWizard.hideLegacyTypes"
                        defaultMessage="Hide types"
                      />
                    ) : (
                      <FormattedMessage
                        id="visualizations.newVisWizard.showLegacyTypes"
                        defaultMessage="Show types"
                      />
                    )}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            }
            forceState={isLegacyOpen ? 'open' : 'closed'}
            onToggle={this.onLegacyToggle}
          >
            {isLegacyOpen && (
              <EuiPanel
                hasBorder={false}
                className="visNewVisDialog__legacyContent"
                color="plain"
                data-test-subj="legacyVisTypesContent"
                hasShadow={false}
                paddingSize="m"
              >
                {this.renderTypeSelector(
                  filteredLegacyTypes,
                  i18n.translate('visualizations.newVisWizard.filterLegacyTypesPlaceholder', {
                    defaultMessage: 'Filter classic visualization types',
                  }),
                  i18n.translate('visualizations.newVisWizard.selectLegacyVisType', {
                    defaultMessage: 'Select a legacy visualization type',
                  }),
                  'tooltip'
                )}
              </EuiPanel>
            )}
          </EuiAccordion>
        </EuiPanel>
      </div>
    );
  }

  private renderRecommendedType = (recommendedType: VisTypeAlias) => (
    <EuiPanel
      key={recommendedType.name}
      color="primary"
      hasShadow={false}
      paddingSize="m"
      className="visNewVisDialog__recommendedPanel"
    >
      <EuiFlexGroup alignItems="center" gutterSize="l" responsive>
        <EuiFlexItem grow={false}>
          <div className="visNewVisDialog__optionIcon">
            <VisTypeIcon icon={recommendedType.icon} />
          </div>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap>
            <EuiFlexItem grow={false}>
              <EuiTitle size="xs">
                <h3>{recommendedType.title}</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="primary">
                <FormattedMessage
                  id="visualizations.newVisWizard.recommendedBadge"
                  defaultMessage="Recommended"
                />
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
          <EuiText size="s" color="subdued">
            <p>{recommendedType.promotion!.description}</p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            iconType="arrowRight"
            iconSide="right"
            onClick={() => this.props.onVisTypeSelected(recommendedType)}
            data-test-subj={`recommendedVisType-${recommendedType.name}`}
          >
            {recommendedType.promotion!.buttonText}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );

  private renderFlatSelection(visTypes: Array<VisType | VisTypeAlias>) {
    const filteredVisTypes = this.filterVisTypes(visTypes, this.state.query);

    return (
      <div className="visNewVisDialog__body">
        {this.renderTypeSelector(
          filteredVisTypes,
          i18n.translate('visualizations.newVisWizard.filterTypesPlaceholder', {
            defaultMessage: 'Filter',
          }),
          i18n.translate('visualizations.newVisWizard.selectVisType', {
            defaultMessage: 'Select a visualization type',
          })
        )}
      </div>
    );
  }

  private renderTypeSelector(
    visTypes: VisTypeListEntry[],
    filterPlaceholder: string,
    helpTitle: string,
    descriptionMode: DescriptionMode = 'panel'
  ) {
    const { highlightedType, query } = this.state;
    const showDescriptionPanel = descriptionMode === 'panel';

    return (
      <EuiFlexGroup
        className={showDescriptionPanel ? undefined : 'visNewVisDialog__typeSelector--fullWidth'}
        gutterSize="xl"
      >
        <EuiFlexItem>
          <EuiFlexGroup
            className="visNewVisDialog__list"
            direction="column"
            gutterSize="none"
            responsive={false}
          >
            <EuiFlexItem grow={false} className="visNewVisDialog__searchWrapper">
              <EuiCompressedFieldSearch
                placeholder={filterPlaceholder}
                value={query}
                onChange={this.onQueryChange}
                fullWidth
                data-test-subj="filterVisType"
                aria-label={i18n.translate('visualizations.newVisWizard.filterVisTypeAriaLabel', {
                  defaultMessage: 'Filter for a visualization type',
                })}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={1} className="visNewVisDialog__typesWrapper">
              <EuiScreenReaderOnly>
                <span aria-live="polite">
                  {query && (
                    <FormattedMessage
                      id="visualizations.newVisWizard.resultsFound"
                      defaultMessage="{resultCount} {resultCount, plural,
                        one {type}
                        other {types}
                      } found"
                      values={{
                        resultCount: visTypes.filter((type) => type.highlighted).length,
                      }}
                    />
                  )}
                </span>
              </EuiScreenReaderOnly>
              <EuiKeyPadMenu className="visNewVisDialog__types" data-test-subj="visNewDialogTypes">
                {visTypes.map((visType) => this.renderVisType(visType, descriptionMode))}
              </EuiKeyPadMenu>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        {showDescriptionPanel && (
          <EuiFlexItem className="visNewVisDialog__description" grow={false}>
            {highlightedType ? (
              <VisHelpText {...highlightedType} />
            ) : (
              <React.Fragment>
                <EuiTitle size="s">
                  <h2>{helpTitle}</h2>
                </EuiTitle>
                <EuiSpacer size="m" />
                <NewVisHelp />
              </React.Fragment>
            )}
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
  }

  private getVisTypeGroups(visTypes: TypesStart): VisTypeGroups {
    const filterExperimental = (type: VisType | VisTypeAlias): boolean => {
      if (!this.props.showExperimental && type.stage === 'experimental') {
        return false;
      }
      return true;
    };

    const types = visTypes
      .all()
      .filter(filterExperimental)
      .filter((type) => !type.hidden); // Filter out hidden visualizations
    const aliasedTypes = visTypes
      .getAliases()
      .filter(filterExperimental)
      .filter((type) => !type.hidden);
    const recommendedTypes = aliasedTypes.filter((type) => Boolean(type.promotion));
    const hasRecommendedTypes = recommendedTypes.length > 0;

    return {
      flatTypes: orderBy([...types, ...aliasedTypes], ['title'], ['asc']),
      legacyTypes: hasRecommendedTypes
        ? orderBy([...types, ...aliasedTypes.filter((type) => type.isClassic)], ['title'], ['asc'])
        : [],
      recommendedTypes: orderBy(recommendedTypes, ['title'], ['asc']),
      workflowTypes: hasRecommendedTypes
        ? orderBy(
            aliasedTypes.filter((type) => !type.promotion && !type.isClassic),
            ['title'],
            ['asc']
          )
        : [],
    };
  }

  private filterVisTypes(
    visTypes: Array<VisType | VisTypeAlias>,
    query: string
  ): VisTypeListEntry[] {
    const q = query.toLowerCase();
    const entries = visTypes.map((type) => {
      const matchesQuery =
        type.name.toLowerCase().includes(q) ||
        type.title.toLowerCase().includes(q) ||
        (typeof type.description === 'string' && type.description.toLowerCase().includes(q));

      return {
        type,
        highlighted: query !== '' && matchesQuery,
      };
    });

    return orderBy(entries, ['highlighted', 'type.title'], ['desc', 'asc']);
  }

  private renderVisType = (visType: VisTypeListEntry, descriptionMode: DescriptionMode) => {
    let stageTooltipContent: string | undefined;
    let stage: {
      betaBadgeLabel?: string;
      betaBadgeTooltipContent?: string;
    } = {};
    let highlightMsg;
    if (visType.type.stage === 'experimental') {
      stageTooltipContent = i18n.translate('visualizations.newVisWizard.experimentalTooltip', {
        defaultMessage:
          'This visualization might be changed or removed in a future release and is not subject to the support SLA.',
      });
      stage = {
        betaBadgeLabel: i18n.translate('visualizations.newVisWizard.experimentalTitle', {
          defaultMessage: 'Experimental',
        }),
        betaBadgeTooltipContent: stageTooltipContent,
      };
      highlightMsg = i18n.translate('visualizations.newVisWizard.experimentalDescription', {
        defaultMessage:
          'This visualization is experimental. The design and implementation are less mature than stable visualizations and might be subject to change.',
      });
    } else if (isVisTypeAlias(visType.type) && visType.type.stage === 'beta') {
      const aliasDescription = i18n.translate('visualizations.newVisWizard.betaDescription', {
        defaultMessage:
          'This visualization is in beta and is subject to change. The design and code is less mature than official GA features and is being provided as-is with no warranties. Beta features are not subject to the support SLA of official GA features',
      });
      stage = {
        betaBadgeLabel: i18n.translate('visualizations.newVisWizard.betaTitle', {
          defaultMessage: 'Beta',
        }),
        betaBadgeTooltipContent: aliasDescription,
      };
      stageTooltipContent = aliasDescription;
      highlightMsg = aliasDescription;
    }

    const isDisabled = this.state.query !== '' && !visType.highlighted;
    const onClick = () => this.props.onVisTypeSelected(visType.type);

    const highlightedType: HighlightedType = {
      title: visType.type.title,
      name: visType.type.name,
      description: visType.type.description,
      highlightMsg,
    };

    const tooltipContent =
      visType.type.description || stageTooltipContent ? (
        <>
          {visType.type.description}
          {visType.type.description && stageTooltipContent && <br />}
          {stageTooltipContent && <em>{stageTooltipContent}</em>}
        </>
      ) : undefined;
    const itemStage =
      descriptionMode === 'tooltip' ? { betaBadgeLabel: stage.betaBadgeLabel } : stage;

    const item = (
      <EuiKeyPadMenuItem
        key={visType.type.name}
        label={<span data-test-subj="visTypeTitle">{visType.type.title}</span>}
        onClick={onClick}
        onFocus={() => this.setHighlightType(highlightedType)}
        onMouseEnter={() => this.setHighlightType(highlightedType)}
        onMouseLeave={() => this.setHighlightType(null)}
        onBlur={() => this.setHighlightType(null)}
        className="visNewVisDialog__type"
        data-test-subj={`visType-${visType.type.name}`}
        data-vis-stage={!isVisTypeAlias(visType.type) ? visType.type.stage : 'alias'}
        disabled={isDisabled}
        aria-describedby={
          descriptionMode === 'panel' ? `visTypeDescription-${visType.type.name}` : undefined
        }
        {...itemStage}
      >
        <VisTypeIcon
          icon={visType.type.icon}
          image={'image' in visType.type ? visType.type.image : undefined}
        />
      </EuiKeyPadMenuItem>
    );

    if (descriptionMode === 'tooltip' && tooltipContent) {
      return (
        <EuiToolTip key={visType.type.name} content={tooltipContent}>
          {item}
        </EuiToolTip>
      );
    }

    return item;
  };

  private setHighlightType(highlightedType: HighlightedType | null) {
    this.setState({
      highlightedType,
    });
  }

  private onLegacyToggle = (isLegacyOpen: boolean) => {
    this.setState({
      highlightedType: null,
      isLegacyOpen,
    });
  };

  private onQueryChange = (ev: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      query: ev.target.value,
    });
  };
}

export { TypeSelection };
