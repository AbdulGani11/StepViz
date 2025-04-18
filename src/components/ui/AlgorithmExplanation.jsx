import { useState, useEffect, useCallback } from 'react';
import { Book, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const AlgorithmExplanation = ({ code, analysisComplete = false }) => {
    const [expanded, setExpanded] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchedCode, setFetchedCode] = useState('');

    // Memoized formatText function to prevent unnecessary re-renders
    const formatText = useCallback((text) => {
        if (!text) return '';

        // Clean up and format text
        let formatted = text.trim().replace(/^\"+|\"+$/g, '');

        // Convert headers
        formatted = formatted.replace(/^# (.*?)$/gm, '<h3 class="font-bold text-gray-800 mt-3 mb-2">$1</h3>');
        formatted = formatted.replace(/^## (.*?)$/gm, '<h4 class="font-semibold text-gray-700 mt-2 mb-1">$1</h4>');

        // Convert lists
        formatted = formatted.replace(/^\* (.*?)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*?<\/li>(\n|$))+/g, m => `<ul class="list-disc pl-5 my-2">${m}</ul>`);

        // Convert code
        formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');

        // Convert paragraphs (anything not already in HTML tags)
        formatted = formatted.replace(/^(?!<[a-z])(.*?)$/gm, m => m.trim() ? `<p>${m}</p>` : '');

        return formatted;
    }, []);

    // Fetch algorithm explanation when code changes
    useEffect(() => {
        // Only skip if no code or already fetched this exact code
        if (!code || code === fetchedCode || !code.trim()) return;

        const controller = new AbortController();
        const { signal } = controller;

        const fetchExplanation = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('http://localhost:3001/api/explain-algorithm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code }),
                    signal
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                if (!signal.aborted) {
                    setExplanation(data.explanation);
                    setFetchedCode(code);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch explanation:', err);
                    setError(err.message);
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        // Add delay to avoid API conflicts
        const timer = setTimeout(fetchExplanation, 1000);

        // Cleanup function
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [code, fetchedCode]);

    // Don't render if no code
    if (!code?.trim()) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
            {/* Header - always visible */}
            <div
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center">
                    <Book className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                        <h3 className="font-medium text-gray-900">Algorithm Explanation</h3>
                        <div className="text-xs text-gray-500">
                            {isLoading ? 'Generating explanation...' : 'AI analysis of your code'}
                        </div>
                    </div>
                </div>
                {expanded ?
                    <ChevronUp className="w-4 h-4 text-gray-400" /> :
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                }
            </div>

            {/* Content - only visible when expanded */}
            {expanded && (
                <div className="p-4 text-sm border-t border-gray-200 bg-gray-50">
                    {isLoading && (
                        <div className="text-center py-4">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-600">Analyzing with DeepSeek AI...</p>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="p-3 bg-red-50 rounded-md text-red-700 text-sm">
                            Failed to generate explanation: {error}
                        </div>
                    )}

                    {explanation && !isLoading && !error && (
                        <div className="max-h-[350px] overflow-y-auto pr-2">
                            <div dangerouslySetInnerHTML={{ __html: formatText(explanation) }} />
                            <div className="mt-4 text-xs text-center text-gray-500">
                                Generated by DeepSeek AI
                            </div>
                        </div>
                    )}

                    {!explanation && !isLoading && !error && (
                        <div className="text-center py-4">
                            <Lightbulb className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                            <p>Run your code to get an explanation</p>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .overflow-y-auto::-webkit-scrollbar {
                    width: 6px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
};

export default AlgorithmExplanation;