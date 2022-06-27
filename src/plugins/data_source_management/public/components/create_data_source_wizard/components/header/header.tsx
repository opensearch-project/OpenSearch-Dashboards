import React from 'react';

import { EuiBetaBadge, EuiSpacer, EuiTitle, EuiText, EuiCode, EuiLink } from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagmentContext } from '../../../../types';

// todo: update everything to data source please :D
export const Header = ({
  prompt,
  indexPatternName,
  isBeta = false,
  docLinks,
}: {
  prompt?: React.ReactNode;
  indexPatternName: string;
  isBeta?: boolean;
  docLinks: DocLinksStart;
}) => {
  const changeTitle = useOpenSearchDashboards<DataSourceManagmentContext>().services.chrome.docTitle
    .change;
  const createIndexPatternHeader = i18n.translate(
    'indexPatternManagement.createIndexPatternHeader',
    {
      defaultMessage: 'Create {indexPatternName}',
      values: { indexPatternName },
    }
  );

  changeTitle(createIndexPatternHeader);

  return (
    <div>
      <EuiTitle>
        <h1>
          {createIndexPatternHeader}
          {isBeta ? (
            <>
              {' '}
              <EuiBetaBadge
                label={i18n.translate('indexPatternManagement.createIndexPattern.betaLabel', {
                  defaultMessage: 'Beta',
                })}
              />
            </>
          ) : null}
        </h1>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText>
        <p>
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.description"
            defaultMessage="An index pattern can match a single source, for example, {single}, or {multiple} data sources, {star}."
            values={{
              multiple: <strong>multiple</strong>,
              single: <EuiCode>filebeat-4-3-22</EuiCode>,
              star: <EuiCode>filebeat-*</EuiCode>,
            }}
          />
          <br />
          <EuiLink
            href={docLinks.links.noDocumentation.indexPatterns.introduction}
            target="_blank"
            external
          >
            <FormattedMessage
              id="indexPatternManagement.createIndexPattern.documentation"
              defaultMessage="Read documentation"
            />
          </EuiLink>
        </p>
      </EuiText>
      {prompt ? (
        <>
          <EuiSpacer size="m" />
          {prompt}
        </>
      ) : null}
    </div>
  );
};
