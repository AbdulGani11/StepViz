import { COLORS } from '../visualization/colors';

// Simple component for a legend item to reduce repetition
const LegendItem = ({ color, isAnimated, title, description }) => (
    <div className="flex items-center gap-3">
        <span
            style={{ color }}
            className={`font-mono font-bold transform scale-110 ${isAnimated ? 'animate-pulse' : ''}`}
        >
            →
        </span>
        <div className="flex flex-col">
            <span className="text-gray-700 font-medium">{title}</span>
            <span className="text-xs text-gray-500">{description}</span>
        </div>
    </div>
);

const CodeLegend = () => {
    // Legend items defined as data for flexibility
    const legendItems = [
        {
            color: COLORS.execution.previous,
            title: "Previous line",
            description: "Code that was processed in the previous step",
            isAnimated: false
        },
        {
            color: COLORS.execution.current,
            title: "Current execution line",
            description: "Code being executed in this step",
            isAnimated: true
        }
    ];

    return (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3 bg-gray-50 border-y border-gray-200 text-sm">
            {legendItems.map((item, index) => (
                <LegendItem
                    key={index}
                    color={item.color}
                    isAnimated={item.isAnimated}
                    title={item.title}
                    description={item.description}
                />
            ))}
        </div>
    );
};

export default CodeLegend;