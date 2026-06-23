import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

window.MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

loader.config({ monaco });

const themeName = "form-builder";

monaco.editor.defineTheme(themeName, {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#ffffff",
    "editorLineNumber.foreground": "#626a6e",
    "editorCursor.foreground": "#3c31d5",
    "editor.selectionBackground": "#dceeff",
    "editor.lineHighlightBackground": "#f7f7f7",
  },
});

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: false,
  schemas: [],
});

export { monaco, themeName };
