/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  DragEvent,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { DragDataType } from './types';

// TODO: Replace any with correct type
// TODO: Split into separate files
interface IDragDropContext {
  data: DragDataType;
  setData?: (data: DragDataType) => void;
  isDragging: boolean;
  setIsDragging?: any;
}

const EMPTY_DATA: DragDataType = {
  namespace: null,
  value: null,
};

const defaultContextProps: IDragDropContext = {
  isDragging: false,
  data: EMPTY_DATA,
};

const DragDropContext = createContext<IDragDropContext>(defaultContextProps);

const DragDropProvider: FC<ReactNode> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [data, setData] = useState<DragDataType>(EMPTY_DATA);
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

export interface IDropAttributes {
  onDragOver: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onDragEnter: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
}

export interface IDropState {
  isDragging: boolean;
  canDrop: boolean;
  isValidDropTarget: boolean;
  dragData: DragDataType['value'];
}
const useDrop = (
  namespace: DragDataType['namespace'],
  onDropCallback: (data: DragDataType['value']) => void
): [IDropAttributes, IDropState] => {
  const { data, isDragging, setIsDragging, setData } = useDragDropContext();
  const [canDrop, setCanDrop] = useState(0);

  const dropAttributes: IDropAttributes = {
    onDragOver: (event) => {
      event.preventDefault();
    },
    onDrop: (event) => {
      setIsDragging(false);
      setCanDrop(0);
      onDropCallback(data.value);
      setData!({
        namespace: null,
        value: null,
      });
    },
    onDragEnter: (event) => {
      if (data?.namespace === namespace) {
        setCanDrop((state) => state + 1);
      }
    },
    onDragLeave: (event) => {
      setCanDrop((state) => state - 1);
    },
  };

  useEffect(() => {
    if (!isDragging) setCanDrop(0);
  }, [isDragging]);

  return [
    dropAttributes,
    {
      isDragging,
      canDrop: canDrop > 0,
      isValidDropTarget: isDragging && data?.namespace === namespace,
      dragData: data.value,
    },
  ];
};

export { DragDropContext, DragDropProvider, useDragDropContext, useDrag, useDrop };
