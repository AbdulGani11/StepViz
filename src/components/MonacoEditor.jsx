import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { pythonService, usePythonStore } from '../services/PythonService';

// Python code for syntax validation - fixed indentation and line handling
const PYTHON_VALIDATION_CODE = `
import ast

def validate_syntax(code):
    try:
        # First check syntax
        ast.parse(code)
        
        # Then check for runtime errors by executing in a safe context
        try:
            # Create a copy of the code to check for runtime errors
            exec(compile(code, '<string>', 'exec'), {})
            return None
        except (TypeError, IndexError, NameError) as e:
            # Get line number from traceback
            import sys, traceback
            tb = traceback.extract_tb(sys.exc_info()[2])
            return {
                'line': tb[-1].lineno if tb else 1,
                'column': 1,
                'message': str(e)
            }
    except SyntaxError as e:
        return {
            'line': e.lineno,
            'column': e.offset,
            'message': str(e)
        }
    except Exception as e:
        return {
            'line': 1,
            'column': 1,
            'message': str(e)
        }
`;

// Editor options extracted for clarity
const EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    wordWrap: 'on'
};

// Error styling - extracted to avoid inline styles
const ERROR_STYLES = `
.errorLine {
    background: #ff000020;
    border-bottom: 2px solid #ff0000;
}
.errorGlyph {
    background: #ff0000;
    border-radius: 50%;
    width: 8px !important;
    height: 8px !important;
    margin-left: 5px;
}
`;

const MonacoEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const { isInitialized } = usePythonStore();
    const decorationsRef = useRef([]);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    // Improved validation function with better error handling
    const validateCode = async (code) => {
        if (!code?.trim() || !isInitialized) return;

        try {
            // Ensure consistent line endings in the code before passing to Python
            const normalizedCode = code.replace(/\r\n/g, '\n');

            // Run the validation with the normalized code
            await pythonService.pyodide.runPythonAsync(`
${PYTHON_VALIDATION_CODE}
# Note the indentation here is important
error = validate_syntax(${JSON.stringify(normalizedCode)})
            `);

            const error = pythonService.pyodide.globals.get('error');
            const errorData = error?.toJs();

            updateEditorDecorations(errorData);
        } catch (error) {
            console.error('Validation error:', error);
        }
    };

    // Extracted decoration logic for better readability
    const updateEditorDecorations = (errorData) => {
        if (!editorRef.current) return;

        // Clear previous decorations
        decorationsRef.current = editorRef.current.deltaDecorations(
            decorationsRef.current,
            []
        );

        if (errorData) {
            // Add new error decoration
            const lineNumber = errorData.line;
            decorationsRef.current = editorRef.current.deltaDecorations(
                [],
                [{
                    range: {
                        startLineNumber: lineNumber,
                        startColumn: 1,
                        endLineNumber: lineNumber,
                        endColumn: 1000
                    },
                    options: {
                        isWholeLine: true,
                        className: 'errorLine',
                        glyphMarginClassName: 'errorGlyph',
                        hoverMessage: { value: errorData.message }
                    }
                }]
            );
        }
    };

    // Add error styles to document head
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = ERROR_STYLES;
        document.head.appendChild(style);
        return () => style.remove();
    }, []);

    const handleChange = (newValue) => {
        onChange(newValue);
        validateCode(newValue);
    };

    return (
        <Editor
            height="550px"
            defaultLanguage="python"
            value={value}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            options={EDITOR_OPTIONS}
        />
    );
};

export default MonacoEditor;