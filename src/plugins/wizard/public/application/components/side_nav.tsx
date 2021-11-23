/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';

import {
  EuiFormLabel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTabbedContent,
  EuiTabbedContentTab,
} from '@elastic/eui';

import { IndexPattern, IndexPatternField, OSD_FIELD_TYPES } from '../../../../data/public';
import { DataTab } from './data_tab';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../types';
import { StyleTab } from './style_tab';

import './side_nav.scss';

interface SideNavDeps {
  indexPattern: IndexPattern | null;
  setIndexPattern: React.Dispatch<React.SetStateAction<IndexPattern | null>>;
}

const ALLOWED_FIELDS: string[] = [OSD_FIELD_TYPES.STRING, OSD_FIELD_TYPES.NUMBER];

export const SideNav = ({ indexPattern, setIndexPattern }: SideNavDeps) => {
  const {
    services: {
      data,
      savedObjects: { client: savedObjectsClient },
    },
  } = useOpenSearchDashboards<WizardServices>();
  const { IndexPatternSelect } = data.ui;
  const [indexFields, setIndexFields] = useState<IndexPatternField[]>([]);

  // Fetch the default index pattern using the `data.indexPatterns` service, as the component is mounted.
  useEffect(() => {
    const setDefaultIndexPattern = async () => {
      const defaultIndexPattern = await data.indexPatterns.getDefault();
      setIndexPattern(defaultIndexPattern);
    };

    setDefaultIndexPattern();
  }, [data, setIndexPattern]);

  // Update the fields list every time the index pattern is modified.
  useEffect(() => {
    const fields = indexPattern?.fields;

    setIndexFields(fields?.filter(isValidField) || []);
  }, [indexPattern]);

  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'data-tab',
      name: i18n.translate('wizard.nav.dataTab.title', {
        defaultMessage: 'Data',
      }),
      content: <DataTab indexFields={indexFields} />,
    },
    {
      id: 'style-tab',
      name: i18n.translate('wizard.nav.styleTab.title', {
        defaultMessage: 'Style',
      }),
      content: <StyleTab />,
    },
  ];

  return (
    <section className="wizSidenav">
      <div className="wizDatasourceSelector">
        <EuiFormLabel>
          {i18n.translate('wizard.nav.dataSource.selector.title', {
            defaultMessage: 'Index Pattern',
          })}
        </EuiFormLabel>
        <IndexPatternSelect
          savedObjectsClient={savedObjectsClient}
          placeholder={i18n.translate('wizard.nav.dataSource.selector.placeholder', {
            defaultMessage: 'Select index pattern',
          })}
          indexPatternId={indexPattern?.id || ''}
          onChange={async (newIndexPatternId: any) => {
            const newIndexPattern = await data.indexPatterns.get(newIndexPatternId);
            setIndexPattern(newIndexPattern);
          }}
          isClearable={false}
        />
      </div>
      <EuiTabbedContent tabs={tabs} className="wizSidenavTabs" />
    </section>
  );
};

// TODO: Temporary validate function
// Need to identify hopw to get fieldCounts to use the standard filter and group functions
function isValidField(field: IndexPatternField): boolean {
  const isAggregatable = field.aggregatable === true;
  const isNotScripted = !field.scripted;
  const isAllowed = ALLOWED_FIELDS.includes(field.type);

  return isAggregatable && isNotScripted && isAllowed;
}
