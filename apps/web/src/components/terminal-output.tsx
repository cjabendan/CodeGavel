"use client";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { examService } from "@/lib/services/exam-services";
import "@xterm/xterm/css/xterm.css";

export interface TerminalOutputRef {
  runCode: () => void;
}

interface TerminalOutputProps {
  code: string;
  sessionId?: string;
}

function cleanTerminalOutput(raw: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Terminal output cleaning requires matching ANSI escape codes and ASCII control characters
  const ansiControlRegex = /\x1b\][^\x07\x1b]*(\x07|\x1b\\)|\x1b\[[0-?]*[ -/]*[@-~]|\x1b[@-Z\\-_]|[\x00-\x09\x0B-\x1F\x7F]/g;

  return raw
    .replace(ansiControlRegex, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "")
    .replace(/\[Process exited\]/g, "")
    .trim();
}

export const TerminalOutput = forwardRef<TerminalOutputRef, TerminalOutputProps>(({ code, sessionId }, ref) => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const isUnmountingRef = useRef(false);

  // Output buffer for capturing total output stream
  const outputBufferRef = useRef<string>("");
  const sessionIdRef = useRef<string | undefined>(sessionId);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const connectWebSocket = useCallback(() => {
    if (isUnmountingRef.current) return;

    const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
    const defaultWsUrl = `ws://${host}:8080`;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || defaultWsUrl;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      if (isUnmountingRef.current) return;
      setIsConnected(true);
      termRef.current?.writeln("\x1b[32m[Connected to C-Runner Engine]\x1b[0m\r\n");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "output") {
          termRef.current?.write(payload.data);
          // Accumulate raw terminal output chunks into local buffer
          outputBufferRef.current += payload.data;
        } else if (payload.type === "exit") {
          setIsExecuting(false);

          // Save accumulated output to PocketBase upon execution completion
          if (sessionIdRef.current) {
            const cleanOutput = cleanTerminalOutput(outputBufferRef.current);
            examService.saveTerminalOutput(sessionIdRef.current, cleanOutput);
          }
        }
      } catch {
        termRef.current?.write(event.data);
      }
    };

    ws.onerror = () => {
      if (isUnmountingRef.current || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
        return;
      }
      setIsConnected(false);
      setIsExecuting(false);
    };

    ws.onclose = () => {
      if (isUnmountingRef.current) return;

      setIsConnected(false);
      setIsExecuting(false);
      termRef.current?.writeln("\r\n\x1b[31m[Disconnected from runner. Reconnecting...]\x1b[0m\r\n");

      setTimeout(() => {
        if (!isUnmountingRef.current && terminalContainerRef.current) {
          connectWebSocket();
        }
      }, 3000);
    };
  }, []);

  useEffect(() => {
    isUnmountingRef.current = false;
    if (!terminalContainerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "monospace",
      theme: { background: "#09090b", foreground: "#f4f4f5" },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    fitAddon.fit();
    termRef.current = term;

    connectWebSocket();

    term.onData((data) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "input", data }));
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      isUnmountingRef.current = true;
      window.removeEventListener("resize", handleResize);

      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      }

      term.dispose();
    };
  }, [connectWebSocket]);

  const executeCode = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN && termRef.current) {
      setIsExecuting(true);

      // Reset buffer for new execution run
      outputBufferRef.current = "";

      // Notify PocketBase session state
      if (sessionIdRef.current) {
        examService.runCode(sessionIdRef.current, code);
      }

      termRef.current.clear();
      termRef.current.writeln("\x1b[33mCompiling and running...\x1b[0m\r\n");
      socketRef.current.send(
        JSON.stringify({
          type: "run",
          code,
          cols: termRef.current.cols,
          rows: termRef.current.rows,
        }),
      );
    } else {
      termRef.current?.writeln("\x1b[31m[Error: Terminal runner offline. Waiting for connection...]\x1b[0m\r\n");
    }
  };

  useImperativeHandle(ref, () => ({
    runCode: executeCode,
  }));

  return (
    <div className="h-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono">
      <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
        <span className="text-xs text-zinc-400 font-semibold px-2">Terminal</span>

        <div className="flex items-center gap-2 px-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? (isExecuting ? "bg-amber-400 animate-ping" : "bg-emerald-500 animate-pulse") : "bg-red-500"
            }`}
          />
          <span
            className={`text-xs font-semibold ${
              isConnected ? (isExecuting ? "text-amber-400" : "text-emerald-400") : "text-red-400"
            }`}
          >
            {isConnected ? (isExecuting ? "Executing..." : "Online") : "Offline"}
          </span>
        </div>
      </div>
      <div ref={terminalContainerRef} className="flex-1 p-2 overflow-hidden" />
    </div>
  );
});

TerminalOutput.displayName = "TerminalOutput";