import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { monaco, themeName } from "@/monaco/setup";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  fontSize: 13,
  lineNumbers: "on",
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: "line",
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
};

const handleMount: OnMount = () => {
  monaco.editor.setTheme(themeName);
};

export function JsonMonacoEditor({ id, label, value, onChange }: Props) {
  return (
    <div className="monaco-json-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="monaco-json-editor" id={id}>
        <Editor
          height="100%"
          defaultLanguage="json"
          theme={themeName}
          value={value}
          options={editorOptions}
          onChange={(nextValue) => onChange(nextValue ?? "")}
          onMount={handleMount}
        />
      </div>
    </div>
  );
}
