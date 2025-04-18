import { usePythonStore } from '../services/PythonService';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play, Pause } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Button styling constants
const BUTTON_STYLES = {
    base: "flex items-center justify-center p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500",
    primary: "bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
    action: "disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
};

const ExecutionControls = () => {
    const {
        executionSteps,
        currentStepIndex,
        setCurrentStepIndex,
        executionState
    } = usePythonStore();

    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // Speed multiplier
    const autoPlayTimerRef = useRef(null);

    const totalSteps = executionSteps?.length || 1;
    const isRunning = executionState?.isRunning;

    // Handle auto-play functionality
    useEffect(() => {
        if (isAutoPlaying && !isRunning) {
            // Clear any existing timer
            if (autoPlayTimerRef.current) {
                clearTimeout(autoPlayTimerRef.current);
            }

            // Set timer for next step
            if (currentStepIndex < totalSteps - 1) {
                const delay = 1000 / playbackSpeed; // Adjust delay based on speed
                autoPlayTimerRef.current = setTimeout(() => {
                    setCurrentStepIndex(currentStepIndex + 1);
                }, delay);
            } else {
                // If we've reached the end, stop auto-play
                setIsAutoPlaying(false);
            }
        }

        return () => {
            if (autoPlayTimerRef.current) {
                clearTimeout(autoPlayTimerRef.current);
            }
        };
    }, [isAutoPlaying, currentStepIndex, totalSteps, isRunning, playbackSpeed, setCurrentStepIndex]);

    const handleFirst = () => {
        setIsAutoPlaying(false);
        setCurrentStepIndex(0);
    };

    const handlePrev = () => {
        setIsAutoPlaying(false);
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const handleNext = () => {
        setIsAutoPlaying(false);
        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const handleLast = () => {
        setIsAutoPlaying(false);
        setCurrentStepIndex(totalSteps - 1);
    };

    const toggleAutoPlay = () => {
        setIsAutoPlaying(!isAutoPlaying);
    };

    const handleSliderChange = (e) => {
        setIsAutoPlaying(false);
        const newIndex = parseInt(e.target.value);
        if (newIndex >= 0 && newIndex < totalSteps) {
            setCurrentStepIndex(newIndex);
        }
    };

    const handleSpeedChange = (e) => {
        setPlaybackSpeed(parseFloat(e.target.value));
    };

    // Check if navigation is disabled
    const isAtStart = currentStepIndex === 0 || isRunning || !executionSteps?.length;
    const isAtEnd = currentStepIndex >= totalSteps - 1 || isRunning || !executionSteps?.length;
    const isPlayDisabled = isAtEnd || isRunning || !executionSteps?.length;
    const isSliderDisabled = !executionSteps?.length || isRunning;

    // Define classes for the different button types
    const primaryButtonClass = `${BUTTON_STYLES.base} ${BUTTON_STYLES.primary}`;
    const secondaryButtonClass = `${BUTTON_STYLES.base} ${BUTTON_STYLES.secondary}`;
    const actionButtonClass = `${BUTTON_STYLES.base} ${BUTTON_STYLES.action} ${isAutoPlaying ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`;

    return (
        <div className="w-full border-t border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleAutoPlay}
                        disabled={isPlayDisabled}
                        className={actionButtonClass}
                        title={isAutoPlaying ? "Pause execution" : "Auto-play execution"}
                    >
                        {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    {isAutoPlaying && (
                        <div className="flex items-center space-x-2 ml-2">
                            <span className="text-xs text-gray-500">Speed:</span>
                            <select
                                value={playbackSpeed}
                                onChange={handleSpeedChange}
                                className="text-xs p-1 border border-gray-300 rounded"
                            >
                                <option value="0.5">0.5x</option>
                                <option value="1">1x</option>
                                <option value="2">2x</option>
                                <option value="4">4x</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleFirst}
                        disabled={isAtStart}
                        className={secondaryButtonClass}
                        title="First Step"
                    >
                        <ChevronsLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handlePrev}
                        disabled={isAtStart}
                        className={primaryButtonClass}
                        title="Previous Step"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="w-64 flex flex-col items-center px-2">
                        <input
                            type="range"
                            min="0"
                            max={totalSteps - 1}
                            value={currentStepIndex}
                            onChange={handleSliderChange}
                            disabled={isSliderDisabled}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="text-center mt-2 text-sm font-medium text-gray-600">
                            Step {currentStepIndex} of {totalSteps - 1}
                        </div>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={isAtEnd}
                        className={primaryButtonClass}
                        title="Next Step"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleLast}
                        disabled={isAtEnd}
                        className={secondaryButtonClass}
                        title="Last Step"
                    >
                        <ChevronsRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExecutionControls;