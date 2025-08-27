/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import classnames from 'classnames';
import { EuiButtonIcon } from '@elastic/eui';

export interface ImageUploadQueueProps {
  images: Array<{ contentType: string; bytes: string }>;
  onRemoveImage: (index: number) => void;
  className?: string;
}

export const ImageUploadQueue = ({
  images,
  onRemoveImage,
  className = '',
}: ImageUploadQueueProps) => {
  if (images.length === 0) return null;

  return (
    <div className={classnames('chatImageUploadQueue', className)}>
      {images.map((image, index) => (
        <div key={index} className="chatImageUploadQueue__item">
          <img
            src={`data:${image.contentType};base64,${image.bytes}`}
            alt={`Selected image ${index + 1}`}
            className="chatImageUploadQueue__image"
          />
          <EuiButtonIcon
            iconType="cross"
            onClick={() => onRemoveImage(index)}
            className="chatImageUploadQueue__removeButton"
          />
        </div>
      ))}
    </div>
  );
};
