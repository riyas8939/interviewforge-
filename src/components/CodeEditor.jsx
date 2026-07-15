import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, Cpu } from 'lucide-react';
import { codingAPI } from '../services/api';

const CodeEditor = ({ language, questionId, initialTemplate, onExecutionSuccess }) => {
  const [code, setCode] = useState(initialTemplate || getStarterTemplate(language));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  function getStarterTemplate(lang) {
    const templates = {
      'python': 'def solve():\n    # Write your solution here\n    print("Hello, Python Sandbox!")\n\nsolve()\n',
      'javascript': 'function solve() {\n    // Write your solution here\n    console.log("Hello, Node JS!");\n}\n\nsolve();\n',
      'java': 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n        System.out.println("Hello, Java Sandbox!");\n    }\n}\n',
      'c++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    cout << "Hello, C++ Sandbox!" << endl;\n    return 0;\n}\n'
    };
    return templates[lang.toLowerCase()] || '// Write your code here\n';
  }

  const handleReset = () => {
    if (window.confirm("Reset code editor to starter template?")) {
      setCode(getStarterTemplate(language));
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const response = await codingAPI.runCode(code, language, questionId);
      setResult(response.data);
      if (onExecutionSuccess) {
        onExecutionSuccess(response.data);
      }
    } catch (err) {
      setResult({
        output: "Execution failed to start.",
        compilation_error: err.response?.data?.detail || err.message,
        test_cases_passed: 0,
        test_cases_total: 2
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0F162A',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Editor Controls Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#090D1A',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} color="#06B6D4" />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#F8FAFC' }}>
            Coding Sandbox ({language})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              padding: '6px 16px',
              backgroundColor: '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Play size={14} fill="white" />
            {running ? 'Running...' : 'Execute Code'}
          </button>
        </div>
      </div>

      {/* Editor Frame */}
      <div style={{ flex: 1, minHeight: '350px' }}>
        <Editor
          height="100%"
          language={language.toLowerCase() === 'c++' ? 'cpp' : language.toLowerCase()}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            automaticLayout: true
          }}
        />
      </div>

      {/* Console Execution Results */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#090D1A',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        maxHeight: '220px',
        overflowY: 'auto'
      }}>
        <h4 style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Console Output</h4>
        
        {running && (
          <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
            Compiling and running tests in background container...
          </p>
        )}

        {!running && !result && (
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Press "Execute Code" to evaluate your solution.
          </p>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Test cases passed badge */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: result.compilation_error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: result.compilation_error ? '#EF4444' : '#10B981'
              }}>
                {result.compilation_error ? (
                  <>
                    <AlertTriangle size={14} />
                    Compilation Failed
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Test Cases: {result.test_cases_passed} / {result.test_cases_total} Passed
                  </>
                )}
              </div>
              
              {!result.compilation_error && (
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#64748B' }}>
                  <span>Time: <b>{result.execution_time}s</b></span>
                  <span>Memory: <b>{result.memory_used}MB</b></span>
                </div>
              )}
            </div>

            {/* Error logs */}
            {result.compilation_error && (
              <pre style={{
                padding: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                color: '#EF4444',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                whiteSpace: 'pre-wrap'
              }}>{result.compilation_error}</pre>
            )}

            {/* Print outputs */}
            {result.output && (
              <pre style={{
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                color: '#E2E8F0',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                whiteSpace: 'pre-wrap'
              }}>{result.output}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
