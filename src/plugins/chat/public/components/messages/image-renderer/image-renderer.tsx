/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import classnames from 'classnames';
import { ImageData } from '../../../../common/types';
import './image-renderer.scss';

export interface ImageRendererProps {
  /**
   * The image data containing format and bytes
   */
  image: ImageData;

  /**
   * Optional content to display alongside the image
   */
  content?: string;

  /**
   * Additional CSS class name for styling
   */
  className?: string;
}

export const ImageRenderer = ({ image, content, className = '' }: ImageRendererProps) => {
  const [imageError, setImageError] = useState(false);
  const imageSrc = `data:image/${image.format};base64,${image.bytes}`;
  const altText =
    content ||
    i18n.translate('chat.message.imageRenderer.altText', {
      defaultMessage: 'User uploaded image',
    });

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={classnames('chatImageRenderer', 'chatImageRenderer__error', className)}>
        <div className="chatImageRenderer__errorMessage">
          {i18n.translate('chat.message.imageRenderer.errorTitle', {
            defaultMessage: 'Failed to load image',
          })}
        </div>
        {content && <div className="chatImageRenderer__content">{content}</div>}
      </div>
    );
  }

  return (
    <div className={classnames('chatImageRenderer', className)}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <img
        src={imageSrc}
        alt={altText}
        className="chatImageRenderer__image"
        onError={handleImageError}
      />
      {content && <div className="chatImageRenderer__content">{content}</div>}
    </div>
  );
};
