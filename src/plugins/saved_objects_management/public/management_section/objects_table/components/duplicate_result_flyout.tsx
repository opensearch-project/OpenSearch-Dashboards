/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './import_summary.scss';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiIcon,
  EuiIconTip,
  EuiLink,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import _ from 'lodash';
import React, { Fragment } from 'react';
import { i18n } from '@osd/i18n';
import { SavedObjectsImportError, SavedObjectsImportSuccess } from 'opensearch-dashboards/public';
import { FormattedMessage } from '@osd/i18n/react';
import { getSavedObjectLabel } from '../../..';
import { getDefaultTitle } from '../../../lib';
import { DuplicateObject } from '../../types';

interface CopyItem {
  type: string;
  id: string;
  title: string;
  icon: string;
  outcome: 'copied' | 'error';
  errorMessage?: string;
}

export interface CopyResultProps {
  failedCopies: SavedObjectsImportError[];
  successfulCopies: SavedObjectsImportSuccess[];
}

export interface DuplicateResultFlyoutProps {
  workspaceName: string;
  failedCopies: SavedObjectsImportError[];
  successfulCopies: SavedObjectsImportSuccess[];
  onClose: () => void;
  onCopy: (
    savedObjects: DuplicateObject[],
    includeReferencesDeep: boolean,
    targetWorkspace: string,
    targetWorkspaceName: string
  ) => Promise<void>;
  targetWorkspace: string;
  useUpdatedUX: boolean;
  dataSourceUrlForTargetWorkspace: string;
}

interface State {
  isLoading: boolean;
}

const DEFAULT_ICON = 'apps';

const unsupportedTypeErrorMessage = i18n.translate(
  'savedObjectsManagement.objectsTable.copyResult.unsupportedTypeError',
  { defaultMessage: 'Unsupported object type' }
);

const getErrorMessage = ({ error }: SavedObjectsImportError) => {
  if (error.type === 'unknown') {
    return error.message;
  } else if (error.type === 'unsupported_type') {
    return unsupportedTypeErrorMessage;
  } else if (error.type === 'missing_data_source') {
    return i18n.translate('savedObjectsManagement.objectsTable.copyResult.missingDataSourceError', {
      defaultMessage: 'Missing data source: {ds}',
      values: { ds: error.dataSource },
    });
  } else if (error.type === 'missing_references') {
    return i18n.translate('savedObjectsManagement.objectsTable.copyResult.missingReferencesError', {
      defaultMessage: 'Missing references.',
    });
  }
};

export class DuplicateResultFlyout extends React.Component<DuplicateResultFlyoutProps, State> {
  constructor(props: DuplicateResultFlyoutProps) {
    super(props);
    this.state = {
      isLoading: false,
    };
  }

  indexPatternConflictsWarning = (
    <EuiCallOut
      data-test-subj="importSavedObjectsConflictsWarning"
      title={
        <FormattedMessage
          id="savedObjectsManagement.objectsTable.copyResult.indexPatternConflictsTitle"
          defaultMessage="Index Pattern Conflicts"
        />
      }
      color="danger"
      iconType="alert"
    >
      <p>
        <FormattedMessage
          id="savedObjectsManagement.objectsTable.copyResult.indexPatternConflictsDescription"
          defaultMessage="The following {useUpdatedUX, select, true {assets} other {saved objects}} use index patterns that do not exist.
              Please select the index patterns you'd like re-associated with
              them. You can create a new index pattern if necessary."
          values={{
            useUpdatedUX: this.props.useUpdatedUX,
          }}
        />
      </p>
    </EuiCallOut>
  );

  missingDataSourceWarning = (
    <EuiCallOut
      data-test-subj="missingDataSourceWarning"
      title={
        <FormattedMessage
          id="savedObjectsManagement.objectsTable.copyResult.missingDataSourceTitle"
          defaultMessage="Missing Data Source"
        />
      }
      color="danger"
      iconType="alert"
    >
      <p>
        <FormattedMessage
          id="savedObjectsManagement.objectsTable.copyResult.missingDataSourceDescription"
          defaultMessage="The following {useUpdatedUX, select, true {assets} other {saved objects}} can not be copied,
          some of the data sources they use are not associated with {targetWorkspaceDataSourceLink}."
          values={{
            useUpdatedUX: this.props.useUpdatedUX,
            targetWorkspaceDataSourceLink: (
              <EuiLink href={this.props.dataSourceUrlForTargetWorkspace} target="_blank">
                <FormattedMessage
                  id="savedObjectsManagement.objectsTable.copyResult.missingDataSourceCalloutLinkText"
                  defaultMessage="{targetWorkspace}"
                  values={{ targetWorkspace: this.props.workspaceName }}
                />
              </EuiLink>
            ),
          }}
        />
      </p>
    </EuiCallOut>
  );

  private get isShowRemainingButton() {
    return (
      this.props.successfulCopies.length > 0 &&
      !!this.props.failedCopies.find(
        ({ error }) => error.type === 'missing_references' || error.type === 'missing_data_source'
      )
    );
  }

  getCountIndicators(copyItems: CopyItem[]) {
    if (!copyItems.length) {
      return null;
    }

    const outcomeCounts = copyItems.reduce(
      (acc, { outcome }) => acc.set(outcome, (acc.get(outcome) ?? 0) + 1),
      new Map<CopyItem['outcome'], number>()
    );
    const copiedCount = outcomeCounts.get('copied');
    const errorCount = outcomeCounts.get('error');

    return (
      <EuiFlexGroup>
        {copiedCount && (
          <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <h4 className="savedObjectsManagementImportSummary__createdCount">
                <FormattedMessage
                  id="savedObjectsManagement.copyResult.copiedCountHeader"
                  defaultMessage="{copiedCount} Successful"
                  values={{ copiedCount }}
                />
              </h4>
            </EuiTitle>
          </EuiFlexItem>
        )}
        {errorCount && (
          <EuiFlexItem grow={false}>
            <EuiTitle size="xs">
              <h4 className="savedObjectsManagementImportSummary__errorCount">
                <FormattedMessage
                  id="savedObjectsManagement.copyResult.errorCountHeader"
                  defaultMessage="{errorCount} Error copying file"
                  values={{ errorCount }}
                />
              </h4>
            </EuiTitle>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
  }

  getStatusIndicator({ outcome, errorMessage = 'Error' }: CopyItem) {
    switch (outcome) {
      case 'copied':
        return (
          <EuiIconTip
            type={'checkInCircleFilled'}
            color={'success'}
            content={i18n.translate('savedObjectsManagement.copyResult.copiedOutcomeLabel', {
              defaultMessage: 'copied',
            })}
          />
        );
      case 'error':
        return (
          <EuiIconTip
            type={'alert'}
            color={'danger'}
            content={i18n.translate('savedObjectsManagement.copyResult.errorOutcomeLabel', {
              defaultMessage: '{errorMessage}',
              values: { errorMessage },
            })}
          />
        );
    }
  }

  mapFailedCopy(failure: SavedObjectsImportError): CopyItem {
    const { type, id, meta } = failure;
    const title = meta.title || getDefaultTitle({ type, id });
    const icon = meta.icon || DEFAULT_ICON;
    const errorMessage = getErrorMessage(failure);
    return { type, id, title, icon, outcome: 'error', errorMessage };
  }

  mapCopySuccess(obj: SavedObjectsImportSuccess): CopyItem {
    const { type, id, meta } = obj;
    const title = meta.title || getDefaultTitle(obj);
    const icon = meta.icon || DEFAULT_ICON;
    return { type, id, title, icon, outcome: 'copied' };
  }

  renderItems(items: CopyItem[]) {
    return (
      <Fragment>
        {items.map((item, index) => {
          const { type, title, icon } = item;
          return (
            <EuiFlexGroup
              responsive={false}
              key={index}
              alignItems="center"
              gutterSize="s"
              className="savedObjectsManagementImportSummary__row"
            >
              <EuiFlexItem grow={false}>
                <EuiToolTip position="top" content={getSavedObjectLabel(type)}>
                  <EuiIcon aria-label={getSavedObjectLabel(type)} type={icon} size="s" />
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem className="savedObjectsManagementImportSummary__title">
                <EuiText size="s">
                  <p className="eui-textTruncate" title={title}>
                    {title}
                  </p>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <div className="eui-textRight">{this.getStatusIndicator(item)}</div>
              </EuiFlexItem>
            </EuiFlexGroup>
          );
        })}
      </Fragment>
    );
  }

  copyResult({ failedCopies, successfulCopies }: CopyResultProps) {
    const missingDataSourceItems = failedCopies
      .filter(({ error }) => error.type === 'missing_data_source')
      .map((object) => this.mapFailedCopy(object));

    const missingReferencesItems = failedCopies
      .filter(({ error }) => error.type === 'missing_references')
      .map((object) => this.mapFailedCopy(object));

    if (missingReferencesItems.length > 0 || missingDataSourceItems.length > 0) {
      return (
        <Fragment>
          {missingReferencesItems.length > 0 && (
            <>
              {this.indexPatternConflictsWarning}
              <EuiSpacer size="s" />
              {this.renderItems(missingReferencesItems)}
              <EuiHorizontalRule />
            </>
          )}
          {missingDataSourceItems.length > 0 && (
            <>
              {this.missingDataSourceWarning}
              <EuiSpacer size="s" />
              {this.renderItems(missingDataSourceItems)}
            </>
          )}
        </Fragment>
      );
    }

    const copyItems: CopyItem[] = _.sortBy(
      [
        ...failedCopies.map((object) => this.mapFailedCopy(object)),
        ...successfulCopies.map((object) => this.mapCopySuccess(object)),
      ],
      ['type', 'title']
    );

    return (
      <Fragment>
        <EuiTitle size="s" data-test-subj="copySavedObjectsSuccess">
          <h3>
            <FormattedMessage
              id="savedObjectsManagement.copyResult.headerLabelPlural"
              defaultMessage="{itemsCount, plural, one {# {useUpdatedUX, select, true {asset} other {saved object}}} 
              other {# {useUpdatedUX, select, true {assets} other {saved objects}}}} copied"
              values={{ itemsCount: copyItems.length, useUpdatedUX: this.props.useUpdatedUX }}
            />
          </h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        {this.getCountIndicators(copyItems)}
        <EuiHorizontalRule />
        {this.renderItems(copyItems)}
      </Fragment>
    );
  }

  duplicateSavedObjects = async () => {
    const { successfulCopies, workspaceName, onCopy, targetWorkspace } = this.props;

    const savedObjects: DuplicateObject[] = successfulCopies.map(({ id, meta, type }) => {
      return { id, meta, type };
    });

    this.setState({
      isLoading: true,
    });

    await onCopy(savedObjects, false, targetWorkspace, workspaceName);

    this.setState({
      isLoading: false,
    });
  };

  render() {
    const { onClose, failedCopies, successfulCopies, workspaceName, useUpdatedUX } = this.props;
    const { isLoading } = this.state;

    return (
      <EuiFlyout ownFocus onClose={onClose} size="s">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="s">
            <h2>
              <FormattedMessage
                id="savedObjectsManagement.copyResult.title"
                defaultMessage="Copy {useUpdatedUX, select, true {assets} other {saved objects}} to {workspaceName}"
                values={{ workspaceName, useUpdatedUX }}
              />
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>{this.copyResult({ failedCopies, successfulCopies })}</EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiSmallButtonEmpty onClick={onClose} flush="left">
                <FormattedMessage
                  id="savedObjectsManagement.copyResult.closeButton"
                  defaultMessage="Close"
                />
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
            {this.isShowRemainingButton && (
              <EuiFlexItem grow={false}>
                <EuiSmallButton
                  fill
                  onClick={() => this.duplicateSavedObjects()}
                  isLoading={isLoading}
                >
                  <FormattedMessage
                    id="savedObjectsManagement.copyResult.copyRemainingButton"
                    defaultMessage="Copy remaining {itemsCount, plural, one {# {useUpdatedUX, select, true {asset} other {saved object}}} 
              other {# {useUpdatedUX, select, true {assets} other {saved objects}}}}"
                    values={{ useUpdatedUX, itemsCount: successfulCopies.length }}
                  />
                </EuiSmallButton>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }
}
