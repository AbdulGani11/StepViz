// Main configuration file for Python code visualization.
// This file controls all visual aspects of the visualization including: sizes, spacings, colors, and typography.

import { COLORS } from './colors';

/**
 * Layout configurations control positioning and dimensions of visualization elements
 * 
 * All measurements are in pixels unless otherwise specified
 */
export const LAYOUT = {
    // Frame configuration controls the main code execution frame appearance
    frame: {
        padding: 20,        // Space inside frame borders
        lineHeight: 30,     // Vertical space between variables
        width: 220,         // Total default frame width - will adjust based on content
        varSpacing: 25,     // Horizontal space between variable name and value
        minVarWidth: 80,    // Minimum width for variable name column
        valueRightPadding: 15, // Space between value and right frame border
    },

    // Object visualization settings for heap objects (lists, dicts, etc.)
    object: {
        // Starting position for heap objects
        startX: 380,           // X position of first column
        verticalGap: 90,       // Vertical gap between objects in same column
        horizontalOffset: 250, // Horizontal distance between reference object columns

        // Cell dimensions for collections
        cell: {
            size: 100,         // Width of list cells
            height: 35         // Height of list cells
        },

        // Tuple-specific dimensions
        tuple: {
            width: 100,        // Width of tuple visualization
            height: 35,        // Height of tuple visualization
            gap: 40            // Space between tuple elements
        }
    },

    // Overall visualization margins
    margin: {
        top: 15,           // Space above first frame
        right: 40,         // Space on right of visualization
        bottom: 30,        // Space below last frame
        left: 40           // Space on left of visualization
    },

    // Reference indicator positioning
    referenceIndicator: {
        verticalOffset: 10, // Distance below the frame
        width: 300          // Width of the reference indicator box
    }
};

/**
 * Visual styling configuration including colors and typography
 */
export const STYLES = {
    // Color palette for visualization elements
    colors: {
        // Frame appearance colors
        frame: {
            background: COLORS.objects.frame.background,
            border: COLORS.objects.frame.border,
            text: COLORS.gray[800]
        },

        // Colors for different object types in heap
        objects: {
            list: {
                background: '#FFFDE7', // Light yellow
                border: '#FFF59D',     // Slightly darker yellow border
                text: '#8B4513',       // Brown text
            },
            tuple: {
                background: COLORS.objects.list.background,
                border: COLORS.objects.list.border,
                text: COLORS.objects.list.text
            },
            dict: {
                background: COLORS.objects.dict.background,
                border: COLORS.objects.dict.border,
                text: COLORS.objects.dict.text
            },
            function: {
                background: COLORS.objects.function.background,
                border: COLORS.objects.function.border,
                text: COLORS.objects.function.text
            },
            primitive: {
                background: COLORS.objects.primitive.background,
                border: COLORS.objects.primitive.border,
                text: COLORS.objects.primitive.text
            }
        },

        // Arrow and line colors for object connections
        connectors: {
            arrow: COLORS.execution.connector.arrow,
            line: COLORS.execution.connector.line
        },

        // Text colors for different elements
        text: {
            primary: COLORS.gray[800],   // Main text color
            secondary: COLORS.gray[600], // Less emphasized text
            label: COLORS.gray[500]      // Small labels and annotations
        },

        // Execution highlighting
        execution: {
            current: COLORS.execution.current,
            previous: COLORS.execution.previous,
            inactive: COLORS.execution.inactive
        }
    },

    // Typography settings for all text elements
    typography: {
        fontFamily: {
            // Monospace font stack for consistent code display
            mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            // Sans-serif for UI elements
            sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        fontSize: {
            xs: '0.75rem',      // 12px
            small: '0.875rem',  // 14px
            base: '1rem',       // 16px
            lg: '1.125rem',     // 18px
            xl: '1.25rem',      // 20px
            '2xl': '1.5rem',    // 24px
        },
        fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700'
        }
    },

    // Shadows for depth
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }
};

/**
 * Arrow marker definitions for SVG connections
 */
export const MARKERS = {
    arrow: {
        id: 'arrow',              // Unique identifier for arrow marker
        viewBox: '0 -5 10 10',    // SVG viewport for arrow
        refX: 8,                  // X reference point - affects arrow position
        refY: 0,                  // Y reference point - affects arrow position
        markerWidth: 6,           // Width of arrow marker
        markerHeight: 6,          // Height of arrow marker
        path: 'M0,-5L10,0L0,5'    // SVG path for arrow shape
    }
};

/**
 * Type-specific object configurations
 */
export const OBJECT_TYPES = {
    primitive: {
        height: 35,      // Height of primitive value displays
        padding: 14      // Padding around primitive values
    },
    list: {
        minWidth: 100,   // Minimum width for list cells
        padding: 12      // Padding inside list cells
    },
    tuple: {
        width: 100,      // Width of tuple visualization
        height: 35       // Height of tuple visualization
    },
    dict: {
        minWidth: 370,   // Minimum width for dictionary display
        entryHeight: 28, // Height of each key-value pair
        padding: 14      // Padding inside dictionary
    }
};

/**
 * Default settings for overall visualization
 */
export const DEFAULTS = {
    svgSize: {
        width: 900,    // Total visualization width
        height: 500    // Starting height (will adjust based on content)
    },
    frameDefaultHeight: 70,        // Minimum frame height
    minHeapObjectDistance: 60,     // Minimum space between heap objects
    borderRadius: {
        sm: 4,
        md: 6,
        lg: 8
    }
};

/**
 * Utility functions for dynamic calculations
 */
export const utils = {
    /**
     * Calculates frame height based on number of variables
     * @param {number} variableCount - Number of variables in the frame
     * @returns {number} - Calculated frame height in pixels
     */
    calculateFrameHeight: (variableCount) => {
        const minHeight = DEFAULTS.frameDefaultHeight;
        const contentHeight = 40 + (variableCount * LAYOUT.frame.lineHeight);
        return Math.max(minHeight, contentHeight);
    },

    /**
     * Calculates position of heap objects with appropriate spacing
     * @param {number} index - Object index for positioning
     * @param {string} type - Object type ('list', 'dict', etc.)
     * @returns {Object} - {x, y} coordinates for the object
     */
    calculateHeapObjectPosition: (index, type) => {
        // Simple two-column layout: parent lists on left, child lists on right
        if (type === 'list') {
            const parentIndex = Math.floor(index / 10); // Group related items by tens
            const isChildList = index % 10 !== 0;       // Items not divisible by 10 are children

            if (isChildList) {
                // Child lists go in right column
                return {
                    x: LAYOUT.object.startX + 220,  // Fixed position in second column
                    y: LAYOUT.margin.top + 60 + (index * LAYOUT.object.verticalGap / 2)  // Staggered vertically
                };
            } else {
                // Parent lists go in left column
                return {
                    x: LAYOUT.object.startX,  // Fixed position in first column
                    y: LAYOUT.margin.top + 60 + (parentIndex * LAYOUT.object.verticalGap) // Spaced vertically
                };
            }
        } else if (type === 'dict') {
            // Dictionaries in their own column
            return {
                x: LAYOUT.object.startX,
                y: LAYOUT.margin.top + 60 + (index * LAYOUT.object.verticalGap)
            };
        } else {
            // Default positioning for other types
            return {
                x: LAYOUT.object.startX + 100,
                y: LAYOUT.margin.top + 60 + (index * LAYOUT.object.verticalGap / 2)
            };
        }
    },

    /**
     * Gets appropriate object color based on type
     * @param {string} type - Object type ('list', 'dict', etc.)
     * @param {string|null} subtype - Optional subtype (e.g., 'Counter')
     * @returns {Object} - Color object with background, border, text properties
     */
    getObjectColor: (type, subtype = null) => {
        if (subtype) {
            return STYLES.colors.objects[subtype] ||
                STYLES.colors.objects[type] ||
                STYLES.colors.objects.primitive;
        }
        return STYLES.colors.objects[type] || STYLES.colors.objects.primitive;
    }
};