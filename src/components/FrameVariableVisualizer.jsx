import { getObjectTypeColor } from '../visualization/colors';

// Utility functions to simplify component logic
const getTypeIcon = (data, heap) => {
    if (data.type === 'primitive') {
        // Handle primitives based on value type
        if (typeof data.value === 'number') return 'ⓝ';
        if (typeof data.value === 'string') return 'ⓢ';
        if (typeof data.value === 'boolean') return 'ⓑ';
        if (data.value === null) return 'ⓝ';
        return 'ⓟ';
    }

    if (data.type === 'reference' && heap[data.id]) {
        // Handle object references
        const heapObj = heap[data.id];
        switch (heapObj.type) {
            case 'list': return '[]';
            case 'dict': return '{}';
            case 'function': return 'ƒ';
            default: return '○';
        }
    }

    return '?';
};

const formatValue = (data, heap) => {
    if (data.type === 'primitive') {
        // Format primitive values
        if (typeof data.value === 'string') {
            return `"${data.value}"`;
        }
        if (data.value === null) {
            return 'None';
        }
        if (data.value === undefined) {
            return 'undefined';
        }
        if (data.value === true || data.value === false) {
            // Python-style boolean capitalization
            return data.value ? 'True' : 'False';
        }
        return String(data.value);
    }

    if (data.type === 'reference' && heap[data.id]) {
        const heapObj = heap[data.id];

        // Return appropriate representation based on object type
        switch (heapObj.type) {
            case 'list':
                return `List (${heapObj.elements?.length || 0} items)`;
            case 'dict':
                return `Dict (${Object.keys(heapObj.value || {}).length} keys)`;
            case 'function':
                return heapObj.name ? `function ${heapObj.name}()` : 'function()';
            default:
                return heapObj.type || 'Object';
        }
    }

    return 'Unknown';
};

// Variable Component for improved readability and maintainability
const VariableItem = ({ name, data, heap, onSelectVariable }) => {
    const style = getObjectTypeColor(data.type === 'reference' && heap[data.id]
        ? heap[data.id].type
        : 'primitive');

    const typeIcon = getTypeIcon(data, heap);
    const formatted = formatValue(data, heap);
    const isReference = data.type === 'reference';

    return (
        <div
            className={`flex items-center p-2 rounded-md border ${isReference ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
            style={{
                backgroundColor: style.background,
                borderColor: style.border,
            }}
            onClick={() => {
                if (isReference && onSelectVariable) {
                    onSelectVariable(data.id);
                }
            }}
        >
            {/* Type icon */}
            <div
                className="w-6 h-6 flex items-center justify-center rounded-full text-xs mr-2 font-medium"
                style={{
                    backgroundColor: 'white',
                    color: style.text,
                    borderWidth: 1,
                    borderColor: style.border,
                }}
            >
                {typeIcon}
            </div>

            {/* Variable name */}
            <div className="font-mono font-medium" style={{ color: style.text }}>
                {name}
            </div>

            {/* Equal sign */}
            <div className="mx-2 text-gray-500">=</div>

            {/* Value */}
            <div className="font-mono" style={{ color: style.text }}>
                {formatted}
            </div>

            {/* Reference indicator arrow */}
            {isReference && (
                <div className="ml-auto">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: style.text }}
                    >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </div>
            )}
        </div>
    );
};

// Empty state component
const EmptyVariablesMessage = () => (
    <div className="p-4 text-center text-gray-500 italic">
        No variables in this frame
    </div>
);

const FrameVariableVisualizer = ({ variables, heap, onSelectVariable }) => {
    if (!variables || Object.keys(variables).length === 0) {
        return <EmptyVariablesMessage />;
    }

    return (
        <div className="p-2 rounded-md bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-2 px-2">Frame Variables</div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                {Object.entries(variables).map(([name, data]) => (
                    <VariableItem
                        key={name}
                        name={name}
                        data={data}
                        heap={heap}
                        onSelectVariable={onSelectVariable}
                    />
                ))}
            </div>
        </div>
    );
};

export default FrameVariableVisualizer;