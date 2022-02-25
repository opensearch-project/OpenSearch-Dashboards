/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, DragEvent, FC, ReactNode, useContext, useState } from 'react';
import { DragDataType } from './types';

// TODO: Replace any with corret type
// TODO: Split into separate files
interface IDragDropContext {
  data?: DragDataType;
  setData?: (data: DragDataType) => void;
  isDragging: boolean;
  setIsDragging?: any;
}

const defaultContextProps = {
  isDragging: false,
};

const DragDropContext = createContext<IDragDropContext>(defaultContextProps);

const DragDropProvider: FC<ReactNode> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<DragDataType>();
  return (
    <DragDropContext.Provider
      value={{
        data,
        setData,

        isDragging,
        setIsDragging,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
};

const useDragDropContext = () => useContext(DragDropContext);

function useDrag(dragData: DragDataType) {
  const { setData, setIsDragging } = useDragDropContext();
  const dragElementProps = {
    draggable: true,
    onDragStart: (event: DragEvent) => {
      setIsDragging(true);
      setData!(dragData);
    },
    onDragEnd: (event: DragEvent) => {
      setIsDragging(false);
      setData!({
        namespace: null,
        value: null,
      });
    },
  };
  return [dragElementProps];
}

interface IDropAttributes {
  onDragOver: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onDragEnter: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
}

interface IDropState {
  isDragging: boolean;
  canDrop: boolean;
  isValidDropTarget: boolean;
  dragData: any;
}
const useDrop = (
  namespace: DragDataType['namespace'],
  onDropCallback: (data: DragDataType['value']) => void
): [IDropAttributes, IDropState] => {
  const { data, isDragging, setIsDragging, setData } = useDragDropContext();
  const [canDrop, setCanDrop] = useState(false);

  const dropAttributes: IDropAttributes = {
    onDragOver: (event) => {
      event.preventDefault();
    },
    onDrop: (event) => {
      setIsDragging(false);
      onDropCallback(data!.value);
      setData!({
        namespace: null,
        value: null,
      });
    },
    onDragEnter: (event) => {
      if (data?.namespace === namespace) {
        setCanDrop(true);
      }
    },
    onDragLeave: (event) => {
      setCanDrop(false);
    },
  };
  return [
    dropAttributes,
    {
      isDragging,
      canDrop,
      isValidDropTarget: isDragging && data?.namespace === namespace,
      dragData: data?.value,
    },
  ];
};

export { DragDropContext, DragDropProvider, useDragDropContext, useDrag, useDrop };
