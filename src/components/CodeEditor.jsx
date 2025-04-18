import { useState, useEffect } from 'react';
import { Play, Edit2, Maximize2, Minimize2 } from 'lucide-react';
import { pythonService, usePythonStore } from '../services/PythonService';
import MonacoEditor from './MonacoEditor';
import HighlightedCode from './HighlightedCode';
import CodeLegend from './CodeLegend';
import StatusIndicator from './ui/StatusIndicator';

// Extracted components for better readability
const EditorHeader = ({ isRunning, isInitialized, isFullScreen, onToggleFullScreen }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center">
                <img
                    src="/Python.png"
                    alt="Python"
                    className="w-6 h-6 object-contain"
                />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Python Code</h2>

                {/* Modified to only show "Running code..." when user code is running */}
                <div className="flex items-center mt-0.5">
                    <StatusIndicator
                        status={isRunning ? 'loading' : (isInitialized ? 'success' : 'info')}
                        message={isRunning
                            ? 'Running code...'
                            : (isInitialized
                                ? 'Ready to execute Python code'
                                : 'Setting up Python environment...')}
                        className="py-0.5 px-2"
                    />
                </div>
            </div>
        </div>

        <FullScreenButton
            isFullScreen={isFullScreen}
            onToggle={onToggleFullScreen}
        />
    </div>
);

const FullScreenButton = ({ isFullScreen, onToggle }) => (
    <button
        onClick={onToggle}
        className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
    >
        {isFullScreen
            ? <Minimize2 className="w-5 h-5" />
            : <Maximize2 className="w-5 h-5" />}
    </button>
);

const ErrorMessage = ({ message }) => (
    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md mb-4">
        <p className="text-sm text-red-700 font-mono">{message}</p>
    </div>
);

const ActionButtons = ({ isEditing, onVisualize, isRunning, isInitialized, code, hasRun }) => (
    <div className="flex justify-end space-x-3 h-10 flex-shrink-0">
        {!isEditing && (
            <button
                onClick={() => window.location.reload()}
                className="flex items-center px-5 py-2 text-sm font-medium text-gray-700 bg-white border 
                         border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors
                         focus:outline-none"
            >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Code
            </button>
        )}
        {(!hasRun || isEditing) && (
            <button
                onClick={onVisualize}
                disabled={!code?.trim() || isRunning || !isInitialized}
                className="flex items-center px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md
                         hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none"
            >
                <Play className="w-4 h-4 mr-2" />
                Run Code
            </button>
        )}
    </div>
);

// Custom hook for fullscreen functionality - can be reused in other components
const useFullScreenMode = () => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullScreen) {
                setIsFullScreen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen]);

    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    return [isFullScreen, toggleFullScreen];
};

// Main component
const CodeEditor = ({ onCodeChange }) => {
    const [code, setCode] = useState('');
    const [isEditing, setIsEditing] = useState(true);
    const [isFullScreen, toggleFullScreen] = useFullScreenMode();
    const { error, isInitialized } = usePythonStore();
    const [hasRun, setHasRun] = useState(false);


    // State to track only user-initiated code running (not initialization)
    const [isUserCodeRunning, setIsUserCodeRunning] = useState(false);

    // Update parent component with code changes
    useEffect(() => {
        if (typeof onCodeChange === 'function') {
            onCodeChange(code);
        }
    }, [code, onCodeChange]);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    const handleVisualize = async () => {
        if (!code.trim()) return;
        setIsEditing(false);
        setIsUserCodeRunning(true);
        try {
            await pythonService.runCode(code);
            setHasRun(true); // Set to true after execution
        } finally {
            setIsUserCodeRunning(false);
        }
    };

    // Compute container class dynamically
    const containerClass = isFullScreen
        ? 'fixed inset-0 z-50 bg-white'
        : 'h-full rounded-lg shadow-md overflow-hidden';

    return (
        <div className={`flex flex-col ${containerClass}`}>
            <EditorHeader
                isRunning={isUserCodeRunning} // Use the user code running state instead of the store state
                isInitialized={isInitialized}
                isFullScreen={isFullScreen}
                onToggleFullScreen={toggleFullScreen}
            />

            {/* Legend (only show when code is running) */}
            {!isEditing && code && <CodeLegend />}

            {/* Editor Content and Buttons Container */}
            <div className="flex flex-col flex-grow bg-gray-50 p-5 overflow-hidden">
                {error && <ErrorMessage message={error} />}

                {/* Code Container */}
                <div className="flex-grow min-h-0 mb-5">
                    {isEditing ? (
                        <div className="h-full">
                            <MonacoEditor
                                value={code}
                                onChange={handleCodeChange}
                            />
                        </div>
                    ) : (
                        <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto">
                            <div className="p-5">
                                <HighlightedCode code={code} />
                            </div>
                        </div>
                    )}
                </div>

                <ActionButtons
                    isEditing={isEditing}
                    onVisualize={handleVisualize}
                    isRunning={isUserCodeRunning}
                    isInitialized={isInitialized}
                    code={code}
                    hasRun={hasRun}
                />
            </div>
        </div>
    );
};

export default CodeEditor;