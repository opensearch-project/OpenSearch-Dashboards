/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { EuiPopover, EuiButtonIcon, EuiContextMenu } from '@elastic/eui';

export const SwitchLanguage: React.FC = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('PPL'); // Default language

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // console.log(`Language switched to: ${language}`);
    closePopover();
  };

  const panels = [
    {
      id: 0,
      title: 'Select Language',
      items: [
        {
          name: 'PPL',
          icon: selectedLanguage === 'PPL' ? 'check' : 'empty',
          onClick: () => handleLanguageChange('PPL'),
        },
        {
          name: 'Natural Language',
          icon: selectedLanguage === 'Natural Language' ? 'check' : 'empty',
          onClick: () => handleLanguageChange('Natural Language'),
        },
      ],
    },
  ];

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          iconType="globe"
          aria-label="Switch Language"
          onClick={onButtonClick}
          data-test-subj="switchLanguageButton"
        />
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downCenter"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
