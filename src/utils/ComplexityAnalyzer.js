/**
 * Analyzes Python code to estimate time and space complexity
 * @param {string} code - Python code to analyze
 * @param {Function} onAnalysisUpdate - Optional callback for progressive updates
 * @returns {Promise<Object>} Complexity analysis results
 */
export const analyzeComplexity = async (code, onAnalysisUpdate = null) => {
    // Skip analysis for empty code
    if (!code || !code.trim()) return null;

    // Initial loading state
    const loadingState = {
        timeComplexity: "Analyzing...",
        spaceComplexity: "Analyzing...",
        bestCase: "Analyzing...",
        worstCase: "Analyzing...",
        isKnownAlgorithm: false,
        isLoading: true,
        description: "Analyzing algorithm complexity..."
    };

    // If callback provided, send loading state
    if (onAnalysisUpdate) {
        onAnalysisUpdate(loadingState);
    }

    try {
        console.log('Sending analysis request to backend...');

        // Call the backend API
        const response = await fetch('http://localhost:3001/api/analyze-complexity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`Analysis request failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Received analysis result:', result);

        // Create final result with loading state set to false
        const finalResult = {
            ...result,
            isLoading: false
        };

        // Return the analysis
        return finalResult;
    } catch (error) {
        console.error("Analysis failed:", error);
        // Return error state
        const errorResult = {
            timeComplexity: "Error",
            spaceComplexity: "Error",
            bestCase: "Error",
            worstCase: "Error",
            isKnownAlgorithm: false,
            isLoading: false,
            description: "Could not analyze algorithm complexity. Please try again later."
        };
        return errorResult;
    }
};

/**
 * Get color for complexity indicator
 */
export const getComplexityColor = (complexity) => {
    if (!complexity) return '#9CA3AF'; // Gray default

    if (complexity === "Analyzing...") {
        return '#3B82F6'; // Blue for analyzing
    } else if (complexity === "Error") {
        return '#EF4444'; // Red for error
    }

    // Map complexity notation to appropriate colors
    if (complexity.includes('O(1)')) {
        return '#10B981'; // Green for constant time
    } else if (complexity.includes('O(log n)')) {
        return '#3B82F6'; // Blue for logarithmic
    } else if (complexity.includes('O(n)') && !complexity.includes('O(n²)') && !complexity.includes('O(n log n)')) {
        return '#6366F1'; // Indigo for linear
    } else if (complexity.includes('O(n log n)')) {
        return '#8B5CF6'; // Purple for linearithmic
    } else if (complexity.includes('O(n²)')) {
        return '#F59E0B'; // Yellow/amber for quadratic
    } else if (complexity.includes('O(n³)')) {
        return '#F97316'; // Orange for cubic
    } else if (complexity.includes('O(2ⁿ)') || complexity.includes('exponential')) {
        return '#EF4444'; // Red for exponential
    } else if (complexity.includes('O(n^2.7)')) {
        return '#FB7185'; // Pink/rose for Stooge Sort's unusual complexity
    }

    return '#9CA3AF'; // Gray for unknown
};