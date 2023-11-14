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

import {
  EuiButtonEmpty,
  EuiComboBox,
  EuiForm,
  EuiFormRow,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  PopoverAnchorPosition,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useState } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useCallback } from 'react';
import { Observable } from 'rxjs';
import { useObservable } from 'react-use';

interface Props {
  language: string;
  onSelectLanguage: (newLanguage: string) => void;
  anchorPosition?: PopoverAnchorPosition;
  currentApp$?: Observable<string|undefined>
}

export function QueryLanguageSwitcher(props: Props) {
  const dataExplorerOptions = [
    {
      label: 'DQL'
    },
    {
      label: 'Lucene',
    },
    {
      label: 'PPL'
    }
  ]
  const [selectedLanguage, setSelectedLanguage] = useState([dataExplorerOptions[0]])
  
  const osdDQLDocs = useOpenSearchDashboards().services.docLinks?.links.opensearchDashboards.dql
    .base;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const luceneLabel = (
    <FormattedMessage id="data.query.queryBar.luceneLanguageName" defaultMessage="Lucene" />
  );
  const dqlLabel = (
    <FormattedMessage id="data.query.queryBar.dqlLanguageName" defaultMessage="DQL" />
  );
  const dqlFullName = (
    <FormattedMessage
      id="data.query.queryBar.dqlFullLanguageName"
      defaultMessage="OpenSearch Dashboards Query Language"
    />
  );

  

  const button = (
    <EuiButtonEmpty
      size="xs"
      onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      className="euiFormControlLayout__append dqlQueryBar__languageSwitcherButton"
      data-test-subj={'switchQueryLanguageButton'}
    >
      {props.language === 'lucene' ? luceneLabel : dqlLabel}
    </EuiButtonEmpty>
  );

  const handleLanguageChange = useCallback(
    (selectedLanguage: any) => {
      setSelectedLanguage(selectedLanguage)
      console.log("selectedLanguage", selectedLanguage)
      props.onSelectLanguage(selectedLanguage)
    },
    [setSelectedLanguage]
  )

  if(props.currentApp$ && useObservable(props.currentApp$, '') === "data-explorer"){
    return (
      <EuiComboBox
        data-test-subj="languageSelect"
        options={dataExplorerOptions}
        selectedOptions={selectedLanguage}
        onChange={handleLanguageChange}
        singleSelection={{asPlainText: true}}
        isClearable={false}
        async
      />
  );
  }
  else{
    return (	  
      <EuiPopover	    
        id="queryLanguageSwitcherPopover"	      
        anchorClassName="euiFormControlLayout__append"	     
        ownFocus	      
        anchorPosition={props.anchorPosition || 'downRight'}	    
        button={button}	   
        isOpen={isPopoverOpen}	  
        closePopover={() => setIsPopoverOpen(false)}	
        repositionOnScroll	
      >	
        <EuiPopoverTitle>	
          <FormattedMessage	
            id="data.query.queryBar.syntaxOptionsTitle"	
            defaultMessage="Syntax options"	
          />	
        </EuiPopoverTitle>	
        <div style={{ width: '350px' }}>	
          <EuiText>	
            <p>	
              <FormattedMessage	
                id="data.query.queryBar.syntaxOptionsDescription"	
                defaultMessage="The {docsLink} (DQL) offers a simplified query	
                syntax and support for scripted fields. If you turn off DQL,	
                OpenSearch Dashboards uses Lucene."	
                values={{	
                  docsLink: (	
                    <EuiLink href={osdDQLDocs} target="_blank">	
                      {dqlFullName}	
                    </EuiLink>	
                  ),	
                }}	
              />	
            </p>	
          </EuiText>	
  
          <EuiSpacer size="m" />	
  
  
          <EuiForm>	  
            <EuiFormRow label={dqlFullName}>	    
              <EuiSwitch	      
                id="queryEnhancementOptIn"	     
                name="popswitch"	      
                label={	     
                  props.language === 'kuery' ? (	     
                    <FormattedMessage id="data.query.queryBar.dqlOnLabel" defaultMessage="On" />	     
                  ) : (	     
                    <FormattedMessage id="data.query.queryBar.dqlOffLabel" defaultMessage="Off" />	    
                  )	
                }	
                checked={props.language === 'kuery'}	
                onChange={() => {	
                  const newLanguage = props.language === 'lucene' ? 'kuery' : 'lucene';	
                  props.onSelectLanguage(newLanguage);	
                }}	
                data-test-subj="languageToggle"	
              />	
            </EuiFormRow>	
          </EuiForm>	
        </div>	
      </EuiPopover>
    )

  }
 }

