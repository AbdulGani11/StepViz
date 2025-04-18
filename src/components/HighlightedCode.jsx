import { usePythonStore } from '../services/PythonService';
import { COLORS } from '../visualization/colors';
import { useEffect, useRef } from 'react';

// Line styling utilities
const getLineStyle = (isCurrentLine, isPreviousLine) => {
    if (isCurrentLine) {
        return 'bg-blue-50 border-l-4 border-blue-500 pl-2';
    } else if (isPreviousLine) {
        return 'bg-green-50 border-l-4 border-green-500 pl-2';
    }
    return 'border-l-4 border-transparent pl-2';
};

// Execution indicator component for better readability
const ExecutionIndicator = ({ isCurrentLine, isPreviousLine }) => {
    if (isPreviousLine) {
        return (
            <span
                style={{ color: COLORS.execution.previous }}
                className="transform scale-125"
            >
                →
            </span>
        );
    }

    if (isCurrentLine) {
        return (
            <span
                style={{ color: COLORS.execution.current }}
                className="transform scale-125 animate-pulse"
            >
                →
            </span>
        );
    }

    return null;
};

const HighlightedCode = ({ code }) => {
    const { executionSteps, currentStepIndex } = usePythonStore();
    const codeContainerRef = useRef(null);

    // Get current and previous step information
    const currentStep = executionSteps[currentStepIndex];
    const previousStep = currentStepIndex > 0 ? executionSteps[currentStepIndex - 1] : null;
    const currentLine = currentStep?.currentLine;
    const previousLine = previousStep?.currentLine;

    // Split code into lines
    const lines = code.split('\n');

    // Simplified executable line detection
    const isExecutableLine = (lineNum) => {
        if (lineNum <= 0 || lineNum > lines.length) return false;
        const line = lines[lineNum - 1]?.trim();
        return line && !line.startsWith('#');
    };

    // Find nearest executable line with improved logic
    const findNearestExecutableLine = (lineNum) => {
        if (!lineNum) return null;
        if (isExecutableLine(lineNum)) return lineNum;

        // Search ahead first (prioritize forward search)
        for (let i = lineNum + 1; i <= lines.length; i++) {
            if (isExecutableLine(i)) return i;
        }

        // Then search backwards if needed
        for (let i = lineNum - 1; i > 0; i--) {
            if (isExecutableLine(i)) return i;
        }

        return lineNum; // Fallback to original line
    };

    // Get adjusted execution lines
    const adjustedCurrentLine = findNearestExecutableLine(currentLine);
    const adjustedPreviousLine = findNearestExecutableLine(previousLine);

    // Auto-scroll implementation using scrollIntoView
    useEffect(() => {
        // If no line to scroll to, exit early
        if (!adjustedCurrentLine) return;

        // This will run after the render is complete
        const scrollToLine = () => {
            // Get the current line element using the line ID
            const currentLineElement = document.getElementById(`line-${adjustedCurrentLine}`);
            if (!currentLineElement) return;

            // Use scrollIntoView for reliable scrolling
            currentLineElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center' // Center the line in the viewport
            });
        };

        // Use requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(scrollToLine);
    }, [adjustedCurrentLine, currentStepIndex]);

    return (
        <div className="font-mono text-sm h-full overflow-auto" ref={codeContainerRef}>
            {lines.map((line, index) => {
                const lineNumber = index + 1;
                const isCurrentLine = lineNumber === adjustedCurrentLine;
                const isPreviousLine = lineNumber === adjustedPreviousLine;

                return (
                    <div
                        key={lineNumber}
                        id={`line-${lineNumber}`} // Add unique ID for each line for easy access
                        className={`flex items-start code-line py-1.5 transition-colors duration-300 ${getLineStyle(isCurrentLine, isPreviousLine)}`}
                    >
                        {/* Line number */}
                        <div className="w-8 text-right select-none mr-4" style={{ color: COLORS.gray[400] }}>
                            {lineNumber}
                        </div>

                        {/* Execution indicator */}
                        <div className="w-6 flex justify-center font-bold text-lg">
                            <ExecutionIndicator
                                isCurrentLine={isCurrentLine}
                                isPreviousLine={isPreviousLine}
                            />
                        </div>

                        {/* Code content */}
                        <div
                            className={`flex-1 ${isCurrentLine ? 'font-medium' : ''}`}
                            style={{ color: isCurrentLine ? COLORS.gray[900] : COLORS.gray[800] }}
                        >
                            <pre className="whitespace-pre-wrap break-all">{line || '\n'}</pre>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HighlightedCode;