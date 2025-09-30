/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './empty_state.scss';
import React from 'react';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart, ApplicationStart } from 'opensearch-dashboards/public';
import {
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiPageContentBody,
  EuiPageContent,
  EuiIcon,
  EuiSpacer,
  EuiFlexItem,
  EuiDescriptionList,
  EuiFlexGrid,
  EuiCard,
  EuiLink,
  EuiText,
} from '@elastic/eui';
import { useHistory } from 'react-router-dom';
import { reactRouterNavigate } from '../../../../../opensearch_dashboards_react/public';
import { MlCardState } from '../../../types';

export const EmptyState = ({
  onRefresh,
  navigateToApp,
  docLinks,
  getMlCardState,
  canSave,
}: {
  onRefresh: () => void;
  navigateToApp: ApplicationStart['navigateToApp'];
  docLinks: DocLinksStart;
  getMlCardState: () => MlCardState;
  canSave: boolean;
}) => {
  const mlCard = (
    <></>
    // TODO: [RENAMEME] if have a replacement for this view we can re-enable this without
    // upsell. Users can should be able to do everything within the application this card does
    // but without the ML file visualizer.
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/384
    // <EuiFlexItem>
    //   <EuiCard
    //     onClick={() => navigateToApp('ml', { path: '#/filedatavisualizer' })}
    //     className="inpEmptyState__card"
    //     betaBadgeLabel={
    //       getMlCardState() === MlCardState.ENABLED
    //         ? undefined
    //         : i18n.translate(
    //             'datasetManagement.createDataset.emptyState.basicLicenseLabel',
    //             {
    //               defaultMessage: 'Basic',
    //             }
    //           )
    //     }
    //     betaBadgeTooltipContent={i18n.translate(
    //       'datasetManagement.createDataset.emptyState.basicLicenseDescription',
    //       {
    //         defaultMessage: 'This feature requires a Basic license.',
    //       }
    //     )}
    //     isDisabled={getMlCardState() === MlCardState.DISABLED}
    //     icon={<EuiIcon size="xl" type="document" color="subdued" />}
    //     title={
    //       <FormattedMessage
    //         id="datasetManagement.createDataset.emptyState.uploadCardTitle"
    //         defaultMessage="Upload a file"
    //       />
    //     }
    //     description={
    //       <FormattedMessage
    //         id="datasetManagement.createDataset.emptyState.uploadCardDescription"
    //         defaultMessage="Import a CSV, NDJSON, or log file."
    //       />
    //     }
    //   />
    // </EuiFlexItem>
  );

  const createAnyway = (
    <EuiText color="subdued" textAlign="center" size="xs">
      <FormattedMessage
        id="datasetManagement.createDataset.emptyState.createAnyway"
        defaultMessage="Some indices may be hidden. Try to {link} anyway."
        values={{
          link: (
            <EuiLink {...reactRouterNavigate(useHistory(), 'create')} data-test-subj="createAnyway">
              <FormattedMessage
                id="datasetManagement.createDataset.emptyState.createAnywayLink"
                defaultMessage="create an index pattern"
              />
            </EuiLink>
          ),
        }}
      />
    </EuiText>
  );

  return (
    <>
      <EuiPageContent
        className="inpEmptyState"
        grow={false}
        horizontalPosition="center"
        data-test-subj="datasetEmptyState"
      >
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h2>
                <FormattedMessage
                  id="datasetManagement.createDataset.emptyState.noDataTitle"
                  defaultMessage="Ready to try OpenSearch Dashboards? First, you need data."
                />
              </h2>
            </EuiTitle>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiSpacer size="m" />
        <EuiPageContentBody>
          <EuiFlexGrid className="inpEmptyState__cardGrid" columns={3} responsive={true}>
            {/* TODO: [UNCOMMENTME] Once we have long-term fix for https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2684
            <EuiFlexItem>
              <EuiCard
                className="inpEmptyState__card"
                onClick={() => navigateToApp('home', { path: '#/tutorial_directory' })}
                icon={<EuiIcon size="xl" type="database" color="subdued" />}
                title={
                  <FormattedMessage
                    id="datasetManagement.createDataset.emptyState.integrationCardTitle"
                    defaultMessage="Add integration"
                  />
                }
                description={
                  <FormattedMessage
                    id="datasetManagement.createDataset.emptyState.integrationCardDescription"
                    defaultMessage="Add data from a variety of sources."
                  />
                }
              />
            </EuiFlexItem> */}
            {getMlCardState() !== MlCardState.HIDDEN ? mlCard : <></>}
            <EuiFlexItem>
              <EuiCard
                className="inpEmptyState__card"
                onClick={() => navigateToApp('home', { path: '#/tutorial_directory/sampleData' })}
                icon={<EuiIcon size="xl" type="heatmap" color="subdued" />}
                title={
                  <FormattedMessage
                    id="datasetManagement.createDataset.emptyState.sampleDataCardTitle"
                    defaultMessage="Add sample data"
                  />
                }
                description={
                  <FormattedMessage
                    id="datasetManagement.createDataset.emptyState.sampleDataCardDescription"
                    defaultMessage="Load a data set and a OpenSearch Dashboards dashboard."
                  />
                }
              />
            </EuiFlexItem>
          </EuiFlexGrid>
          <EuiSpacer size="xxl" />
          <div className="inpEmptyState__footer">
            <EuiFlexGrid columns={3}>
              <EuiFlexItem className="inpEmptyState__footerFlexItem">
                <EuiDescriptionList
                  listItems={[
                    {
                      title: (
                        <FormattedMessage
                          id="datasetManagement.createDataset.emptyState.learnMore"
                          defaultMessage="Want to learn more?"
                        />
                      ),
                      description: (
                        <EuiLink
                          href={docLinks.links.noDocumentation.addData}
                          target="_blank"
                          external
                        >
                          <FormattedMessage
                            id="datasetManagement.createDataset.emptyState.readDocs"
                            defaultMessage="Read documentation"
                          />
                        </EuiLink>
                      ),
                    },
                  ]}
                />
              </EuiFlexItem>
              <EuiFlexItem className="inpEmptyState__footerFlexItem">
                <EuiDescriptionList
                  listItems={[
                    {
                      title: (
                        <FormattedMessage
                          id="datasetManagement.createDataset.emptyState.haveData"
                          defaultMessage="Think you already have data?"
                        />
                      ),
                      description: (
                        <EuiLink onClick={onRefresh} data-test-subj="refreshIndicesButton">
                          <FormattedMessage
                            id="datasetManagement.createDataset.emptyState.checkDataButton"
                            defaultMessage="Check for new data"
                          />{' '}
                          <EuiIcon type="refresh" size="s" />
                        </EuiLink>
                      ),
                    },
                  ]}
                />
              </EuiFlexItem>
            </EuiFlexGrid>
          </div>
        </EuiPageContentBody>
      </EuiPageContent>
      <EuiSpacer />
      {canSave && createAnyway}
    </>
  );
};
