import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Loader } from 'lucide-react';
import { getComplexityColor } from '../utils/ComplexityAnalyzer';

// Helper component for complexity badges
const ComplexityBadge = ({ complexity, isAnalyzing = false }) => {
    const color = getComplexityColor(complexity);
    return (
        <span
            className="text-sm font-mono font-medium px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `${color}15`, color }}
        >
            {isAnalyzing ? "O(?)" : complexity}
        </span>
    );
};

// Component for the complexity label and value pair
const ComplexityMetric = ({ label, complexity, isAnalyzing = false }) => (
    <div className="flex items-center">
        <span className="text-xs font-medium text-gray-500 mr-2">{label}:</span>
        <ComplexityBadge complexity={complexity} isAnalyzing={isAnalyzing} />
    </div>
);

// Loading indicator component
const AnalyzingIndicator = () => (
    <div className="flex flex-col items-center justify-center py-8">
        <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">Analyzing algorithm complexity with DeepSeek AI...</p>
        <p className="text-xs text-gray-500 mt-2">This may take a few seconds</p>
    </div>
);

// Component to render different section types from the formatted description
const DescriptionSection = ({ section, idx }) => {
    switch (section.type) {
        case 'header':
            return (
                <h4 key={idx} className="font-semibold text-gray-800 mb-1 mt-3">
                    {section.content}
                </h4>
            );
        case 'list':
            return (
                <div key={idx} className="mt-1 mb-3">
                    {section.items.map((item, i) => (
                        <div key={i} className="flex items-start mt-1">
                            <span className="mr-2 text-gray-400">•</span>
                            <span className="text-gray-600">{item}</span>
                        </div>
                    ))}
                </div>
            );
        case 'paragraph':
        default:
            return (
                <p key={idx} className="text-gray-600 mb-3">
                    {section.content}
                </p>
            );
    }
};

// Formatter utility for description text - extracted for clarity
const formatDescription = (desc) => {
    if (!desc) return [];

    // Split by common section headers
    const sections = desc.split(/\*\*|\n\n/).filter(Boolean);

    // Format sections for display
    return sections.map(section => {
        // Check if section is a header
        if (section.includes('Time Complexity') ||
            section.includes('Space Complexity') ||
            section.includes('Algorithm') ||
            section.includes('Best Case') ||
            section.includes('Worst Case')) {
            return { type: 'header', content: section.trim() };
        }

        // Check if section contains bullet points
        if (section.includes('- ')) {
            const lines = section.split('\n').filter(Boolean);
            return {
                type: 'list',
                items: lines.map(line => line.replace(/^- /, '').trim())
            };
        }

        // Regular paragraph
        return { type: 'paragraph', content: section.trim() };
    });
};

const ComplexityDisplay = ({ analysis }) => {
    const [expanded, setExpanded] = useState(false);

    if (!analysis) return null;

    const {
        timeComplexity,
        spaceComplexity,
        bestCase,
        worstCase,
        isKnownAlgorithm,
        algorithmName,
        description,
        isLoading
    } = analysis;

    // Don't display if no complexity data is available
    if (!timeComplexity && !spaceComplexity) return null;

    const formattedDescription = formatDescription(description);
    const isAnalyzing = isLoading || timeComplexity === "Analyzing...";

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Summary bar - always visible */}
            <div
                className="p-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <h3 className="font-medium text-gray-900">
                        {isKnownAlgorithm ? algorithmName : 'Algorithm Complexity'}
                    </h3>

                    {/* Loading indicator */}
                    {isAnalyzing && (
                        <div className="flex items-center space-x-1 ml-2 text-blue-500">
                            <Loader className="w-3 h-3 animate-spin" />
                            <span className="text-xs">Analyzing...</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {timeComplexity && (
                        <ComplexityMetric
                            label="Time"
                            complexity={timeComplexity}
                            isAnalyzing={isAnalyzing}
                        />
                    )}

                    {spaceComplexity && (
                        <ComplexityMetric
                            label="Space"
                            complexity={spaceComplexity}
                            isAnalyzing={isAnalyzing}
                        />
                    )}

                    <div className="text-gray-400">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 py-3 text-sm bg-gray-50 border-t border-gray-200">
                    {isAnalyzing ? (
                        <AnalyzingIndicator />
                    ) : (
                        <>
                            {/* Display formatted description */}
                            {formattedDescription.map((section, idx) => (
                                <DescriptionSection key={idx} section={section} idx={idx} />
                            ))}

                            {/* Powered by note */}
                            <div className="mt-6 text-center text-sm text-gray-500">
                                Analysis powered by DeepSeek AI
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ComplexityDisplay;