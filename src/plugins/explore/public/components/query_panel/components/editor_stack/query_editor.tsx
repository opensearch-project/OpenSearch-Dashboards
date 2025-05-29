// /*
//  * Copyright OpenSearch Contributors
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import React, { useRef, useCallback, useState, useEffect } from 'react';
// import { monaco } from '@osd/monaco';
// import { CodeEditor } from '../../../../../../opensearch_dashboards_react/public';
// import { EditOrClear } from './edit_or_clear';
// import { getEditorConfig, LanguageType } from './shared';

// interface QueryEditorProps {
//   languageType: LanguageType;
//   queryString: string;
//   onChange: (value: string) => void;
//   handleQueryRun: (queryString?: string) => void;
//   isEditorReadOnly: boolean;
//   handleQueryEdit: () => void;
//   handleClearEditor: () => void;
// }

// const FIXED_COMMENT = '// AI Generated PPL at 00.03.33pm';

// export const QueryEditor: React.FC<QueryEditorProps> = ({
//   queryString,
//   languageType,
//   onChange,
//   handleQueryRun,
//   isEditorReadOnly,
//   handleQueryEdit,
//   handleClearEditor,
// }) => {
//   const [editorIsFocused, setEditorIsFocused] = useState(false);
//   const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
//   const [decorated, setDecorated] = useState(false);
//   const blurTimeoutRef = useRef<NodeJS.Timeout | undefined>();
//   const editorConfig = getEditorConfig(languageType);

//   // 🧠 Inject comment only once when content is loaded
//   useEffect(() => {
//     if (queryString && !queryString.startsWith(FIXED_COMMENT)) {
//       onChange(`${FIXED_COMMENT}\n${queryString}`);
//     }
//   }, [queryString, onChange]);

//   const handleEditClick = () => {
//     handleQueryEdit();
//     editorRef.current?.updateOptions({ readOnly: false });
//     editorRef.current?.focus();
//   };

//   const handleEditorDidMount = useCallback(
//     (editor: monaco.editor.IStandaloneCodeEditor) => {
//       const focusDisposable = editor.onDidFocusEditorText(() => {
//         if (blurTimeoutRef.current) {
//           clearTimeout(blurTimeoutRef.current);
//         }
//         setEditorIsFocused(true);
//       });

//       const blurDisposable = editor.onDidBlurEditorText(() => {
//         blurTimeoutRef.current = setTimeout(() => {
//           setEditorIsFocused(false);
//         }, 300);
//       });

//       editorRef.current = editor;

//       // Set up Enter key handling
//       editor.addAction({
//         id: 'run-query-on-enter',
//         label: 'Run Query on Enter',
//         keybindings: [monaco.KeyCode.Enter],
//         contextMenuGroupId: 'navigation',
//         contextMenuOrder: 1.5,
//         run: () => {
//           handleQueryRun(editor.getValue());
//         },
//       });

//       editor.addAction({
//         id: 'insert-new-line-query',
//         label: 'Insert New Line Query',
//         keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
//         run: (ed) => {
//           if (ed.hasTextFocus()) {
//             const currentPosition = ed.getPosition();
//             if (currentPosition) {
//               ed.executeEdits('', [
//                 {
//                   range: new monaco.Range(
//                     currentPosition.lineNumber,
//                     currentPosition.column,
//                     currentPosition.lineNumber,
//                     currentPosition.column
//                   ),
//                   text: '\n',
//                   forceMoveMarkers: true,
//                 },
//               ]);
//               ed.setPosition({
//                 lineNumber: currentPosition.lineNumber + 1,
//                 column: 1,
//               });
//             }
//           }
//         },
//       });

//       // ✅ Decorate comment line after mount (only once)
//       if (!decorated) {
//         editor.createDecorationsCollection([
//           {
//             range: new monaco.Range(1, 1, 1, 1),
//             options: {
//               isWholeLine: true,
//               className: 'comment-line',
//             },
//           },
//         ]);
//         setDecorated(true);
//       }

//       return () => {
//         focusDisposable.dispose();
//         blurDisposable.dispose();
//         if (blurTimeoutRef.current) {
//           clearTimeout(blurTimeoutRef.current);
//         }
//       };
//     },
//     [decorated, handleQueryRun, queryString]
//   );

//   return (
//     <div className="queryEditorWrapper" data-test-subj="osdQueryEditor__multiLine">
//       <div
//         className={`queryEditor ${isEditorReadOnly ? 'queryEditor--readonly' : ''}`}
//         style={editorIsFocused && !isEditorReadOnly ? { borderBottom: '1px solid #006BB4' } : {}}
//         data-test-subj="osdQueryEditor__multiLine"
//       >
//         <CodeEditor
//           height={100}
//           languageId={editorConfig.languageId}
//           value={queryString}
//           onChange={onChange}
//           editorDidMount={handleEditorDidMount}
//           options={editorConfig.options}
//           languageConfiguration={editorConfig.languageConfiguration}
//           triggerSuggestOnFocus={editorConfig.triggerSuggestOnFocus}
//         />

//         {isEditorReadOnly && (
//           <EditOrClear
//             className="queryEditor__editOverlay"
//             handleClearEditor={handleClearEditor}
//             handleEditClick={handleEditClick}
//             editText="Edit Query"
//             clearText="Clear Editor"
//           />
//         )}
//       </div>
//     </div>
//   );
// };

import React, { useState, useEffect } from 'react';
import { getEditorConfig, LanguageType } from './shared';
import { ReusableEditor } from './resuable_editor';
import { monaco } from '@osd/monaco';

interface QueryEditorProps {
  languageType: LanguageType;
  queryString: string;
  onChange: (value: string) => void;
  handleQueryRun: (queryString?: string) => void;
  isEditorReadOnly: boolean;
  handleQueryEdit: () => void;
  handleClearEditor: () => void;
}

const FIXED_COMMENT = '// AI Generated PPL at 00.03.33pm';
const EDITOR_HEIGHT = 100;

export const QueryEditor: React.FC<QueryEditorProps> = ({
  queryString,
  languageType,
  onChange,
  handleQueryRun,
  isEditorReadOnly,
  handleQueryEdit,
  handleClearEditor,
}) => {
  const editorConfig = getEditorConfig(languageType);
  const [decorated, setDecorated] = useState(false);

  // Inject comment only once when content is loaded
  useEffect(() => {
    if (queryString && !queryString.startsWith(FIXED_COMMENT)) {
      onChange(`${FIXED_COMMENT}\n${queryString}`);
    }
  }, [queryString, onChange]);

  const onEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    // Decorate the first line with a comment style if not already decorated
    if (!decorated) {
      editor.createDecorationsCollection([
        {
          range: new monaco.Range(1, 1, 1, 1),
          options: {
            isWholeLine: true,
            className: 'comment-line',
          },
        },
      ]);
      setDecorated(true);
    }
  };

  return (
    <ReusableEditor
      value={queryString}
      onChange={onChange}
      onRun={handleQueryRun}
      isReadOnly={isEditorReadOnly}
      onEdit={handleQueryEdit}
      onClear={handleClearEditor}
      onEditorDidMount={onEditorDidMount}
      editorConfig={editorConfig}
      editText="Edit Query"
      clearText="Clear Editor"
      height={EDITOR_HEIGHT}
      editorType="query" // This is used for styling and identification
    />
  );
};
