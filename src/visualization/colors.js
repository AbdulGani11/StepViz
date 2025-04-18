/*
 * StepViz Color System
 * This file defines a cohesive color system for the entire application
 * to ensure consistent semantic meaning and visual harmony.
 */

export const COLORS = {
    // Primary brand colors
    primary: {
        50: '#EFF6FF',   // Very light blue - backgrounds, highlights
        100: '#DBEAFE',  // Light blue - borders, soft UI elements
        200: '#BFDBFE',  // Lighter blue
        300: '#93C5FD',  // Light blue - secondary elements
        400: '#60A5FA',  // Blue - minor accents
        500: '#3B82F6',  // Main blue - primary actions
        600: '#2563EB',  // Darker blue - hover states
        700: '#1D4ED8',  // Deep blue - active states
        800: '#1E40AF',  // Very dark blue
        900: '#1E3A8A',  // Extremely dark blue
    },

    // Neutrals for text, backgrounds, borders
    gray: {
        50: '#F9FAFB',   // Almost white - main backgrounds
        100: '#F3F4F6',  // Very light gray - card backgrounds
        200: '#E5E7EB',  // Light gray - borders, dividers
        300: '#D1D5DB',  // Gray - disabled elements
        400: '#9CA3AF',  // Medium gray - placeholder text
        500: '#6B7280',  // Medium-dark gray - secondary text
        600: '#4B5563',  // Dark gray - primary text
        700: '#374151',  // Very dark gray - headings
        800: '#1F2937',  // Almost black - important text
        900: '#111827',  // Black - highest emphasis text
    },

    // Semantic colors for states and feedback
    state: {
        // Success states - for completed actions, confirmation
        success: {
            50: '#ECFDF5',  // Light green background
            100: '#D1FAE5', // Light green border
            500: '#10B981', // Green text/icon
            600: '#059669', // Hover state
        },

        // Warning states - for alerts, cautions
        warning: {
            50: '#FFFBEB',  // Light yellow background
            100: '#FEF3C7', // Light yellow border
            500: '#F59E0B', // Yellow text/icon
            600: '#D97706', // Hover state
        },

        // Error states - for errors, destructive actions
        error: {
            50: '#FEF2F2',  // Light red background
            100: '#FEE2E2', // Light red border
            500: '#EF4444', // Red text/icon
            600: '#DC2626', // Hover state
        },

        // Info states - for information, neutral alerts
        info: {
            50: '#EFF6FF',  // Light blue background
            100: '#DBEAFE', // Light blue border
            500: '#3B82F6', // Blue text/icon
            600: '#2563EB', // Hover state
        },
    },

    // Object type colors for visualization
    objects: {
        // Frame and container colors
        frame: {
            background: '#F3F8FF', // Light blue background for frames
            border: '#DBEAFE',     // Light blue border for frames
            title: '#1E40AF',      // Dark blue for frame titles
        },

        // Memory objects by type
        list: {
            background: '#EFF6FF', // Light blue for lists
            border: '#BFDBFE',     // Slightly darker for borders
            text: '#1E40AF',       // Dark blue for text
        },

        dict: {
            background: '#F0FDF4', // Light green for dictionaries
            border: '#BBFCD4',     // Slightly darker for borders
            text: '#047857',       // Dark green for text
        },

        function: {
            background: '#F5F3FF', // Light purple for functions
            border: '#DDD6FE',     // Slightly darker for borders
            text: '#5B21B6',       // Dark purple for text
        },

        primitive: {
            background: '#FFFBEB', // Light yellow for primitives
            border: '#FEF3C7',     // Slightly darker for borders
            text: '#92400E',       // Dark amber for text
        },
    },

    // Execution path visualization
    execution: {
        current: '#DC2626',      // Red for current line
        previous: '#059669',     // Green for previous line
        inactive: '#9CA3AF',     // Gray for inactive lines

        // Connector arrows between objects
        connector: {
            line: '#3B82F6',       // Blue for connection lines
            arrow: '#2563EB',      // Slightly darker blue for arrowheads
        }
    }
};

/**
 * Helper function to get a color with opacity
 * @param {string} color - Hex color code
 * @param {number} opacity - Opacity value from 0 to 1
 * @returns {string} - Color with opacity
 */
export const withOpacity = (color, opacity) => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

/**
 * Returns appropriate colors for different status types
 * @param {string} status - Status type (success, warning, error, info, loading)
 * @returns {object} - Color object with bg, border, text, and hover colors
 */
export const getStatusColor = (status) => {
    switch (status) {
        case 'success':
            return {
                bg: COLORS.state.success[50],
                border: COLORS.state.success[100],
                text: COLORS.state.success[500],
                hover: COLORS.state.success[600],
            };
        case 'warning':
            return {
                bg: COLORS.state.warning[50],
                border: COLORS.state.warning[100],
                text: COLORS.state.warning[500],
                hover: COLORS.state.warning[600],
            };
        case 'error':
            return {
                bg: COLORS.state.error[50],
                border: COLORS.state.error[100],
                text: COLORS.state.error[500],
                hover: COLORS.state.error[600],
            };
        case 'info':
        case 'loading':
            return {
                bg: COLORS.state.info[50],
                border: COLORS.state.info[100],
                text: COLORS.state.info[500],
                hover: COLORS.state.info[600],
            };
        default:
            return {
                bg: COLORS.gray[100],
                border: COLORS.gray[200],
                text: COLORS.gray[500],
                hover: COLORS.gray[600],
            };
    }
};

/**
 * Get appropriate colors for different object types
 * @param {string} type - Object type (list, dict, function, primitive)
 * @returns {object} - Color object with background, border, and text colors
 */
export const getObjectTypeColor = (type) => {
    switch (type) {
        case 'list':
            return COLORS.objects.list;
        case 'dict':
            return COLORS.objects.dict;
        case 'function':
            return COLORS.objects.function;
        case 'primitive':
            return COLORS.objects.primitive;
        default:
            return {
                background: COLORS.gray[100],
                border: COLORS.gray[200],
                text: COLORS.gray[700],
            };
    }
};