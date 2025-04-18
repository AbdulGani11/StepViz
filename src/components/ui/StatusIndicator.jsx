import { Loader } from 'lucide-react';
import { getStatusColor } from '../../visualization/colors';

// Status type constants for better type safety
const STATUS_TYPES = {
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning'
};

// Extracted StatusIcon component for better readability
const StatusIcon = ({ status }) => {
    switch (status) {
        case STATUS_TYPES.LOADING:
            return <Loader className="w-3.5 h-3.5 animate-spin" />;
        case STATUS_TYPES.SUCCESS:
        case STATUS_TYPES.ERROR:
        case STATUS_TYPES.WARNING:
        case STATUS_TYPES.INFO:
        default:
            // All other statuses use the dot indicator with appropriate color
            return <div className="w-2.5 h-2.5 rounded-full bg-current" />;
    }
};

/**
 * StatusIndicator component displays a status badge with appropriate styling
 * 
 * @param {string} status - The status type: 'loading', 'success', 'error', 'warning', or 'info'
 * @param {string} message - The message to display
 * @param {string} className - Additional classes to apply
 */
const StatusIndicator = ({ status, message, className = '' }) => {
    // Get appropriate colors for the status type
    const statusColors = getStatusColor(status);

    return (
        <div
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm ${className}`}
            style={{
                backgroundColor: statusColors.bg,
                borderColor: statusColors.border,
                color: statusColors.text
            }}
        >
            <StatusIcon status={status} />
            <span className="text-xs font-medium">{message}</span>
        </div>
    );
};

// Export constants for use in other components
export { STATUS_TYPES };
export default StatusIndicator;