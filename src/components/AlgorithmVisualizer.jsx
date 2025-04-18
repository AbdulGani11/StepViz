import { useState, useEffect } from 'react';
import { Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { usePythonStore } from '../services/PythonService';
import PythonTutorViz from './PythonTutorViz';
import ExecutionControls from './ExecutionControls';
import ComplexityDisplay from './ComplexityDisplay';
import AlgorithmExplanation from './ui/AlgorithmExplanation';
import ErrorBoundary from './ErrorBoundary';
import { analyzeComplexity } from '../utils/ComplexityAnalyzer';

// Output panel component to display console output
const OutputPanel = () => {
    const { executionState, error } = usePythonStore();
    const output = executionState?.output || '';

    // Check for any type of error message
    const hasError = output.includes('Error:') || output.includes('KeyError:') || error;
    const errorMessage = hasError ? (output || error) : '';

    // Determine panel styling based on error state
    const outputClasses = hasError
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-white border-gray-200 text-gray-700';

    return (
        <div className="border-b border-gray-200 bg-gray-50">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-100 p-1.5 rounded-md">
                            <Terminal className="w-4 h-4 text-gray-600" />
                        </div>
                        <h3 className="text-base font-medium text-gray-700">Console Output</h3>
                    </div>

                    {/* Status indicator */}
                    {output && !hasError && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-green-600">Program executed</span>
                        </div>
                    )}
                    {hasError && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            <span className="text-xs font-medium text-red-600">Error</span>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <pre
                        className={`min-h-[80px] max-h-[120px] p-4 ${outputClasses} 
                                  border rounded-lg font-mono text-sm overflow-y-auto whitespace-pre-wrap`}
                    >
                        {hasError ? errorMessage : (output || 'No output yet')}
                    </pre>

                    {/* Empty state placeholder */}
                    {!output && !hasError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm text-gray-400">Output will appear here</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Custom hook for fullscreen toggle functionality
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

// Header component with title and fullscreen toggle
const VisualizerHeader = ({ isFullScreen, toggleFullScreen }) => (
    <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Visualization</h2>

        <button
            onClick={toggleFullScreen}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
            {isFullScreen
                ? <Minimize2 className="w-5 h-5" />
                : <Maximize2 className="w-5 h-5" />
            }
        </button>
    </div>
);

// Hook for complexity analysis
const useComplexityAnalysis = (code) => {
    const [complexityAnalysis, setComplexityAnalysis] = useState(null);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    useEffect(() => {
        if (!code?.trim()) {
            setComplexityAnalysis(null);
            setAnalysisComplete(false);
            return;
        }

        const analyzeCode = async () => {
            setAnalysisComplete(false);

            try {
                // Get complexity analysis, providing a callback for progressive updates
                const analysis = await analyzeComplexity(code, (updatedAnalysis) => {
                    // This will be called with updates if the analyzer implements progressive updates
                    setComplexityAnalysis(updatedAnalysis);
                });

                // Set the final analysis
                setComplexityAnalysis(analysis);
                setAnalysisComplete(true);
            } catch (err) {
                console.error("Complexity analysis failed:", err);
                // Simple error state if analysis throws an exception
                setComplexityAnalysis({
                    timeComplexity: "Error",
                    spaceComplexity: "Error",
                    bestCase: "Error",
                    worstCase: "Error",
                    isKnownAlgorithm: false,
                    isLoading: false,
                    description: "Could not analyze algorithm complexity. Please try again later."
                });
                setAnalysisComplete(true);
            }
        };

        analyzeCode();
    }, [code]);

    return { complexityAnalysis, analysisComplete };
};

const AlgorithmVisualizer = ({ code }) => {
    const { executionState, executionSteps } = usePythonStore();
    const [isFullScreen, toggleFullScreen] = useFullScreenMode();
    const { complexityAnalysis, analysisComplete } = useComplexityAnalysis(code);

    // Check if we have execution data to display
    const hasData = executionState && (executionState.frame || executionState.frames);
    const hasMultipleSteps = executionSteps?.length > 1;

    // Compute container class dynamically
    const containerClass = isFullScreen
        ? 'fixed inset-0 z-50 bg-white'
        : 'h-full bg-white rounded-lg shadow-md overflow-hidden';

    return (
        <div className={`flex flex-col ${containerClass}`}>
            <VisualizerHeader
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
            />

            <OutputPanel />

            {/* Algorithm Explanation Panel - show for any valid code execution */}
            {hasData && hasMultipleSteps && (
                <div className="px-4 py-3">
                    <AlgorithmExplanation
                        code={code}
                        analysisComplete={analysisComplete}
                    />
                </div>
            )}

            {/* Complexity Analysis Panel */}
            {complexityAnalysis && hasData && hasMultipleSteps && (
                <div className="px-4 py-3">
                    <ComplexityDisplay analysis={complexityAnalysis} />
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto border-b border-gray-200 w-full">
                <ErrorBoundary>
                    <PythonTutorViz />
                </ErrorBoundary>
            </div>

            <ExecutionControls />
        </div>
    );
};

export default AlgorithmVisualizer;