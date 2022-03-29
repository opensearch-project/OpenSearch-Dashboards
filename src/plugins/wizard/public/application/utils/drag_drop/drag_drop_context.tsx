/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, DragEvent, FC, ReactNode, useContext, useState } from 'react';

interface DrapDataType {
  namespace: string;
  value: any;
}

// TODO: Replace any with corret type
// TODO: Split into separate files
interface IDragDropContext {
  data?: DrapDataType;
  setData?: any;
  isDragging: boolean;
  setIsDragging?: any;
}

const defaultContextProps = {
  isDragging: false,
};

const DragDropContext = createContext<IDragDropContext>(defaultContextProps);

const DragDropProvider: FC<ReactNode> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<DrapDataType>();
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

const useDrag = (dragData: any, namespace: string) => {
  const { setData, setIsDragging } = useDragDropContext();
  const dragElementProps = {
    draggable: true,
    onDragStart: (event: DragEvent) => {
      setIsDragging(true);
      setData({
        namespace,
        value: dragData,
      });
    },
    onDragEnd: (event: DragEvent) => {
      setIsDragging(false);
      setData(null);
    },
  };
  return [dragElementProps];
};

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
const useDrop = (namespace: string, onDropCallback: Function): [IDropAttributes, IDropState] => {
  const { data, isDragging, setIsDragging, setData } = useDragDropContext();
  const [canDrop, setCanDrop] = useState(false);

  const dropAttributes: IDropAttributes = {
    onDragOver: (event) => {
      event.preventDefault();
    },
    onDrop: (event) => {
      setIsDragging(false);
      onDropCallback(data?.value);
      setData(null);
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
