/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './import_summary.scss';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiIcon,
  EuiIconTip,
  EuiSmallButton,
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
  }
};

export class DuplicateResultFlyout extends React.Component<DuplicateResultFlyoutProps, State> {
  constructor(props: DuplicateResultFlyoutProps) {
    super(props);
    this.state = { isLoading: false };
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

  copyResult({ failedCopies, successfulCopies }: CopyResultProps) {
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
              defaultMessage="{itemsCount, plural, one {# saved object} other {# saved objects}} copied"
              values={{ itemsCount: copyItems.length }}
            />
          </h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        {this.getCountIndicators(copyItems)}
        <EuiHorizontalRule />
        {copyItems.map((item, index) => {
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

  render() {
    const { onClose, failedCopies, successfulCopies, workspaceName } = this.props;
    return (
      <EuiFlyout ownFocus onClose={onClose} size="s">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="s">
            <h2>
              <FormattedMessage
                id="savedObjectsManagement.copyResult.title"
                defaultMessage="Copy saved objects to {workspaceName}"
                values={{ workspaceName }}
              />
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>{this.copyResult({ failedCopies, successfulCopies })}</EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiSmallButton onClick={onClose}>
            <FormattedMessage
              id="savedObjectsManagement.copyResult.closeButton"
              defaultMessage="Close"
            />
          </EuiSmallButton>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }
}
