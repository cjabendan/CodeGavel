"use client";

import { cpp } from "@codemirror/lang-cpp";
import CodeMirror from "@uiw/react-codemirror";

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeMirrorEditor({ value, onChange, readOnly = false }: CodeMirrorEditorProps) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm h-full flex flex-col bg-white">
      <CodeMirror
        value={value}
        height="100%"
        minHeight="420px"
        extensions={[cpp()]}
        onChange={onChange}
        readOnly={readOnly}
        theme="dark"
        className="text-xs font-mono flex-1 overflow-auto"
      />
    </div>
  );
}
