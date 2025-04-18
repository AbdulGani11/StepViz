import { useEffect, useRef } from 'react';
import { usePythonStore } from '../services/PythonService';
import * as d3 from 'd3';
import {
    LAYOUT,
    STYLES,
    MARKERS,
    OBJECT_TYPES,
    DEFAULTS,
    utils
} from '../visualization/config';
import { COLORS, getObjectTypeColor } from '../visualization/colors';

/**
 * PythonTutorViz - Main visualization component for Python code execution
 * Renders frames, variables, and object visualizations using D3.js
 */
const PythonTutorViz = () => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const { executionState } = usePythonStore();
    const prevExecutionStateRef = useRef();

    // =====================================================
    // SVG Helper Functions
    // =====================================================

    /**
     * Creates and configures a text element
     * @param {d3.Selection} g - Parent group element
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text content
     * @param {Object} options - Styling options
     * @returns {d3.Selection} - The created text element
     */
    const createText = (g, x, y, text, options = {}) => {
        const {
            className = 'font-mono',
            size = 'base',
            weight = 'normal',
            color = COLORS.gray[800],
            anchor = 'start',
            family = null
        } = options;

        const textElement = g.append('text')
            .attr('x', x)
            .attr('y', y)
            .text(text)
            .attr('class', className)
            .attr('text-anchor', anchor)
            .style('fill', color)
            .style('font-size', STYLES.typography.fontSize[size])
            .style('font-weight', STYLES.typography.fontWeight[weight]);

        // Set font family based on parameter or className
        if (family) {
            textElement.style('font-family', STYLES.typography.fontFamily[family]);
        } else {
            textElement.style('font-family', STYLES.typography.fontFamily.mono);
        }

        return textElement;
    };

    /**
     * Creates and configures a rectangle element
     * @param {d3.Selection} g - Parent group element
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Object} options - Styling options
     * @returns {d3.Selection} - The created rect element
     */
    const createRect = (g, x, y, width, height, options = {}) => {
        const {
            fill = 'white',
            stroke = null,
            strokeWidth = 1,
            radius = DEFAULTS.borderRadius.sm,
            opacity = 1,
            className = null
        } = options;

        const rect = g.append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', width)
            .attr('height', height)
            .attr('fill', fill)
            .attr('rx', radius)
            .attr('opacity', opacity);

        if (stroke) {
            rect.attr('stroke', stroke)
                .attr('stroke-width', strokeWidth);
        }

        if (className) {
            rect.attr('class', className);
        }

        return rect;
    };

    /**
     * Creates and configures a line element
     * @param {d3.Selection} g - Parent group element
     * @param {number} x1 - Start X position
     * @param {number} y1 - Start Y position
     * @param {number} x2 - End X position
     * @param {number} y2 - End Y position
     * @param {Object} options - Styling options
     * @returns {d3.Selection} - The created line element
     */
    const createLine = (g, x1, y1, x2, y2, options = {}) => {
        const {
            stroke = COLORS.gray[200],
            strokeWidth = 1,
            className = null
        } = options;

        const line = g.append('line')
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2)
            .attr('stroke', stroke)
            .attr('stroke-width', strokeWidth);

        if (className) {
            line.attr('class', className);
        }

        return line;
    };

    /**
     * Creates an arrow marker for connections
     * @param {d3.Selection} svg - SVG container
     * @returns {d3.Selection} - The created marker
     */
    const createArrow = (svg) => {
        const defs = svg.append('defs');
        return defs.append('marker')
            .attr('id', MARKERS.arrow.id)
            .attr('viewBox', MARKERS.arrow.viewBox)
            .attr('refX', MARKERS.arrow.refX)
            .attr('refY', MARKERS.arrow.refY)
            .attr('markerWidth', MARKERS.arrow.markerWidth)
            .attr('markerHeight', MARKERS.arrow.markerHeight)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', MARKERS.arrow.path)
            .attr('fill', STYLES.colors.connectors.arrow);
    };

    // =====================================================
    // Object Rendering Functions
    // =====================================================

    /**
     * Draws a function object representation
     * @param {d3.Selection} g - Parent group element
     * @param {Object} data - Function data
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    const drawFunction = (g, data, x, y) => {
        const colors = getObjectTypeColor('function');
        const valueText = data.value;
        const textWidth = valueText.length * 8 + 20;
        const bgHeight = 24;

        // Add background behind function text
        createRect(g, x - 5, y - 5, textWidth, bgHeight, {
            fill: colors.background,
            radius: DEFAULTS.borderRadius.sm
        });

        // Function label
        createText(g, x, y + 10, valueText, {
            className: 'font-mono text-sm',
            color: colors.text,
            size: 'small',
            weight: 'medium'
        });

        // Border around the function name
        createRect(g, x - 5, y - 5, textWidth, bgHeight, {
            fill: 'none',
            stroke: colors.border,
            radius: DEFAULTS.borderRadius.sm
        });
    };

    /**
     * Draws a list object representation with its elements
     * @param {d3.Selection} g - Parent group element
     * @param {Array} elements - List elements
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} heap - Heap object containing references
     * @param {number} level - Recursion level for positioning
     */
    const drawList = (g, elements, x, y, heap = {}, level = 0) => {
        if (!elements || !Array.isArray(elements)) {
            console.warn('Invalid list elements:', elements);
            return;
        }

        const cellSize = LAYOUT.object.cell.size;
        const cellHeight = LAYOUT.object.cell.height;
        const colors = getObjectTypeColor('list');

        // List label
        createText(g, x, y - 12, 'list', {
            className: 'text-xs fill-current',
            color: colors.text,
            weight: 'medium',
            size: 'xs'
        });

        elements.forEach((element, i) => {
            const cellX = x + i * cellSize;

            // Cell background
            createRect(g, cellX, y, cellSize, cellHeight, {
                fill: colors.background,
                stroke: colors.border,
                radius: DEFAULTS.borderRadius.sm
            });

            // Add dividing line for all cells except the last
            if (i < elements.length - 1) {
                createLine(g, cellX + cellSize, y, cellX + cellSize, y + cellHeight, {
                    stroke: colors.border
                });
            }

            // Index above cell
            createText(g, cellX + cellSize / 2, y - 2, i.toString(), {
                className: 'text-xs fill-current',
                color: COLORS.gray[500],
                size: 'xs',
                anchor: 'middle'
            });

            // Render the element value or reference
            renderListElement(g, element, cellX, cellSize, y, cellHeight, colors, heap, i, level, x);
        });
    };

    /**
     * Renders a single list element (either primitive or reference)
     * @param {d3.Selection} g - Parent group element
     * @param {Object} element - Element data
     * @param {number} cellX - Cell X position
     * @param {number} cellSize - Cell width
     * @param {number} y - Y position
     * @param {number} cellHeight - Cell height
     * @param {Object} colors - Cell colors
     * @param {Object} heap - Heap object containing references
     * @param {number} index - Element index
     * @param {number} level - Recursion level
     * @param {number} parentX - Parent list X position
     */
    const renderListElement = (g, element, cellX, cellSize, y, cellHeight, colors, heap, index, level, parentX) => {
        if (element.type === 'primitive') {
            // Format primitive value
            let value = element.value;
            // Format booleans with capital first letter (Python style)
            if (typeof value === 'boolean') {
                value = value.toString().charAt(0).toUpperCase() + value.toString().slice(1);
            }
            // Add quotes for strings
            const valueStr = typeof value === 'string' ? `"${value}"` : String(value);

            // Render primitive value
            createText(g, cellX + cellSize / 2, y + cellHeight / 2 + 5, valueStr, {
                className: 'font-mono text-sm',
                color: colors.text,
                size: 'small',
                anchor: 'middle'
            });
        } else if (element.type === 'reference' && element.id && heap[element.id]) {
            // Handle reference to other objects
            renderReferenceElement(g, element, heap, cellX, cellSize, y, cellHeight, index, level, parentX);
        }
    };

    /**
     * Renders a reference element in a list cell
     * @param {d3.Selection} g - Parent group element
     * @param {Object} element - Reference element data
     * @param {Object} heap - Heap object containing references
     * @param {number} cellX - Cell X position
     * @param {number} cellSize - Cell width
     * @param {number} y - Y position
     * @param {number} cellHeight - Cell height
     * @param {number} index - Element index
     * @param {number} level - Recursion level
     * @param {number} parentX - Parent list X position
     */
    const renderReferenceElement = (g, element, heap, cellX, cellSize, y, cellHeight, index, level, parentX) => {
        const heapObj = heap[element.id];
        const refObjType = heapObj.type || 'primitive';
        const refColors = getObjectTypeColor(refObjType);

        // Determine reference indicator
        let indicator = '?';
        if (heapObj.type === 'list') indicator = '[]';
        else if (heapObj.type === 'dict') indicator = '{}';
        else if (heapObj.type === 'function') indicator = 'fn';

        // Reference indicator box
        createRect(g, cellX + cellSize / 2 - 12, y + cellHeight / 2 - 10, 24, 20, {
            fill: refColors.background,
            stroke: refColors.border,
            radius: 4,
            opacity: 0.8
        });

        // Reference indicator text
        createText(g, cellX + cellSize / 2, y + cellHeight / 2 + 5, indicator, {
            className: 'font-mono text-sm font-medium',
            color: refColors.text,
            weight: 'medium',
            size: 'small',
            anchor: 'middle'
        });

        // Calculate position for referenced object using config values
        const baseHorizontalPos = parentX + heapObj.elements?.length * cellSize + LAYOUT.object.horizontalOffset;
        let refX, refY;

        if (heapObj.type === 'list') {
            refX = baseHorizontalPos;
            refY = y + index * LAYOUT.object.verticalGap;
        } else if (heapObj.type === 'dict') {
            refX = baseHorizontalPos;
            refY = y + index * LAYOUT.object.verticalGap;
        } else {
            refX = baseHorizontalPos;
            refY = y + index * LAYOUT.object.verticalGap;
        }

        // Draw the referenced object recursively (only if depth not too deep)
        if (level < 3) { // Add depth limit to prevent infinite recursion
            if (heapObj.type === 'list') {
                drawList(g, heapObj.elements, refX, refY, heap, level + 1);
                drawConnector(g,
                    { x: cellX + cellSize / 2, y: y + cellHeight / 2 },
                    { x: refX, y: refY },
                    false,
                    index
                );
            } else if (heapObj.type === 'dict') {
                drawDict(g, heapObj.value, refX, refY);
                drawConnector(g,
                    { x: cellX + cellSize / 2, y: y + cellHeight / 2 },
                    { x: refX + (OBJECT_TYPES?.dict?.minWidth || 50) / 2, y: refY },
                    false,
                    index
                );
            }
        }
    };

    /**
     * Draws a dictionary or Counter instance representation
     * @param {d3.Selection} g - Parent group element
     * @param {Object} data - Dictionary data
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} subtype - Optional subtype (e.g., 'Counter')
     */
    const drawDict = (g, data, x, y, subtype = null) => {
        if (!data) {
            console.warn('Invalid dictionary data:', data);
            return;
        }

        // Configuration
        const BOX_HEIGHT = LAYOUT.object.cell.height;
        const BOX_PADDING = 10;

        // Determine dictionary type and colors
        const isCounter = subtype === 'Counter';
        const labelText = isCounter ? 'Counter instance' : 'dict';
        const colors = getObjectTypeColor('dict');

        // Format dictionary as string
        let dictContentStr = "";
        const entries = Object.entries(data);

        dictContentStr = entries.map(([key, value]) => {
            const formattedKey = typeof key === 'string' ? `'${key}'` : String(key);
            const formattedValue = typeof value === 'string' ? `'${value}'` : String(value);
            return `${formattedKey}: ${formattedValue}`;
        }).join(', ');

        let fullString = isCounter
            ? `Counter({${dictContentStr}})`
            : `{${dictContentStr}}`;

        // Calculate box dimensions based on content
        const approxCharWidth = 7.7;
        const estimatedTextWidth = fullString.length * approxCharWidth;
        const boxWidth = Math.max(
            OBJECT_TYPES.dict.minWidth || 150,
            estimatedTextWidth + 2 * BOX_PADDING
        );

        // Dict label
        createText(g, x, y - 12, labelText, {
            className: 'text-xs fill-current',
            color: colors.text,
            weight: STYLES.typography.fontWeight.medium,
            size: STYLES.typography.fontSize.xs
        });

        // Dictionary background
        createRect(g, x, y, boxWidth, BOX_HEIGHT, {
            fill: colors.background,
            stroke: colors.border,
            radius: DEFAULTS.borderRadius.sm
        });

        // Dictionary content
        createText(g, x + BOX_PADDING, y + BOX_HEIGHT / 2 + 5, fullString, {
            className: 'font-mono text-sm',
            color: colors.text,
            size: STYLES.typography.fontSize.small,
            anchor: 'start'
        });
    };

    /**
     * Draws a connector between two points
     * @param {d3.Selection} svg - SVG element
     * @param {Object} source - Source coordinates {x, y}
     * @param {Object} target - Target coordinates {x, y}
     * @param {boolean} isFrame - Whether it's a frame connector
     * @param {number} level - Level for curve variation
     * @returns {d3.Selection} - The created path
     */
    const drawConnector = (svg, source, target, isFrame = false, level = 0) => {
        const path = d3.path();

        if (isFrame) {
            // Frame connectors: Elbow shape
            const midX = source.x + 40;
            path.moveTo(source.x, source.y);
            path.lineTo(midX, source.y);
            path.lineTo(midX, target.y);
            path.lineTo(target.x, target.y);
        } else {
            // Object connectors: Curved shape
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const midX = source.x + dx / 2;
            const midY = source.y + dy / 2;

            // Calculate a perpendicular vector
            const dist = Math.sqrt(dx * dx + dy * dy);
            let normX = 0;
            let normY = 0;

            if (dist > 0) {
                normX = -dy / dist;
                normY = dx / dist;
            } else {
                normX = 0;
                normY = 1;
            }

            // Calculate control point offset based on level
            const curveFactor = 100;
            const offset = (level * 1.0 - 1) * curveFactor;

            // Calculate the bezier control point
            const controlX = midX + normX * offset;
            const controlY = midY + normY * offset;

            // Draw the curve
            path.moveTo(source.x, source.y);
            path.quadraticCurveTo(controlX, controlY, target.x, target.y);
        }

        return svg.append('path')
            .attr('d', path.toString())
            .attr('fill', 'none')
            .attr('stroke', STYLES.colors.connectors.line)
            .attr('stroke-width', 1.5)
            .attr('marker-end', `url(#${MARKERS.arrow.id})`);
    };

    // =====================================================
    // Frame and Stack Rendering
    // =====================================================

    /**
     * Draws the entire call stack with frames
     * @param {d3.Selection} g - Parent group element
     * @param {Array} frames - Frames data
     * @param {Object} heap - Heap object
     */
    const drawCallStack = (g, frames, heap) => {
        let currentY = 0;
        let contentWidth = DEFAULTS.svgSize.width;

        // Check if there's an error in the output
        const hasError = frames.some(frame =>
            frame.output && (
                frame.output.includes("Error:") ||
                frame.output.includes("not found") ||
                frame.output.includes("not supported")
            )
        );

        // Track list info for explanation
        const listInfo = collectListInfo(frames, heap);

        frames.forEach((frameInfo, frameIndex) => {
            // Skip rendering detailed error frames
            if (hasError &&
                frameInfo.name === "Global frame" &&
                Object.keys(frameInfo.variables || {}).some(key =>
                    key === "error_type" || key === "error_msg" || key === "full_message"
                )) {
                // Instead of rendering the error details frame, add a simplified error message
                if (frameIndex === 0) {
                    currentY = renderErrorMessage(g, frameInfo, currentY);
                }
                return;
            }

            const frameGroup = g.append('g')
                .attr('class', 'frame')
                .attr('transform', `translate(0, ${currentY})`);

            // Create a copy of variables to modify
            let variables = { ...frameInfo.variables } || {};

            // Remove 'size' variable if artificially added
            if (variables.size && !frameInfo.originalVariables?.size) {
                delete variables.size;
            }

            const varCount = Object.keys(variables).length;
            const frameHeight = utils.calculateFrameHeight(varCount);
            const { totalWidth, leftColumnWidth } = calculateFrameWidth(variables);

            // Frame background
            createRect(frameGroup, 0, 0, totalWidth, frameHeight, {
                fill: frameInfo.is_highlighted ? STYLES.colors.frame.background : COLORS.gray[50],
                stroke: STYLES.colors.frame.border,
                radius: DEFAULTS.borderRadius.md,
                strokeWidth: 1.5
            });

            // Add grid structure
            drawFrameGrid(frameGroup, variables, totalWidth, frameHeight, leftColumnWidth);

            // Frame title with enhanced styling
            createRect(frameGroup, 0, 0, totalWidth, 35, {
                fill: COLORS.primary[100],
                radius: DEFAULTS.borderRadius.md
            }).attr('ry', 0);

            createText(frameGroup, 12, 24, frameInfo.name, {
                className: 'font-mono text-base font-semibold',
                color: COLORS.primary[800],
                size: 'base',
                weight: 'semibold'
            });

            // Render variables
            Object.entries(variables).forEach(([name, data], i) => {
                renderVariable(frameGroup, name, data, leftColumnWidth, i, heap, g);
            });

            // Update position for next frame
            currentY += frameHeight + 30;

            // Add list size info and indicators if this is the global frame
            if (frameInfo.name === 'Global frame' && listInfo.length > 0) {
                currentY = addInformationalElements(g, listInfo, currentY, totalWidth);
            }
        });

        // Update SVG dimensions
        updateSvgDimensions(currentY);
    };

    /**
     * Renders a user-friendly error message instead of detailed error frames
     * @param {d3.Selection} g - Parent group element
     * @param {Object} frameInfo - Frame data containing error information
     * @param {number} currentY - Current Y position
     * @returns {number} - Updated Y position
     */
    const renderErrorMessage = (g, frameInfo, currentY) => {
        const errorWidth = 600;
        const errorHeight = 80;
        const errorY = currentY + 20;

        // Get the error message from the frame variables
        let errorMsg = "";
        if (frameInfo.variables?.error_msg) {
            errorMsg = frameInfo.variables.error_msg.value || "An error occurred";
        } else if (frameInfo.output) {
            // Try to extract error from output
            const errorMatch = frameInfo.output.match(/Error:([^\n]*)/);
            errorMsg = errorMatch ? errorMatch[1].trim() : "An error occurred";
        }

        // Create the error box
        createRect(g, 0, errorY, errorWidth, errorHeight, {
            fill: COLORS.state.error[50],
            stroke: COLORS.state.error[100],
            radius: DEFAULTS.borderRadius.md
        });

        // Add error title
        createText(g, 20, errorY + 30, "Import Error:", {
            size: 'base',
            weight: 'semibold',
            color: COLORS.state.error[600],
            family: 'sans'
        });

        // Add error message
        createText(g, 20, errorY + 60, errorMsg, {
            size: 'small',
            color: COLORS.state.error[500],
            family: 'sans'
        });

        return errorY + errorHeight + 30;
    };

    /**
     * Collects information about lists in frames for display
     * @param {Array} frames - Frames data
     * @param {Object} heap - Heap object
     * @returns {Array} - Unique list info
     */
    const collectListInfo = (frames, heap) => {
        const listInfo = [];

        frames.forEach(frame => {
            // Skip processing error frames
            if (frame.name === "Error Frame") return;

            if (frame.variables) {
                Object.entries(frame.variables).forEach(([varName, varData]) => {
                    if (varData?.type === 'reference') {
                        const heapObj = heap[varData.id];
                        if (heapObj?.type === 'list' && heapObj.elements) {
                            listInfo.push({
                                name: varName,
                                size: heapObj.elements.length
                            });
                        }
                    }
                });
            }
        });

        // Remove duplicates
        return listInfo.filter((info, index, self) =>
            index === self.findIndex(t => t.name === info.name)
        );
    };

    /**
     * Adds informational elements below the global frame
     * @param {d3.Selection} g - Parent group element
     * @param {Array} listInfo - List information
     * @param {number} currentY - Current Y position
     * @param {number} totalWidth - Frame width
     * @returns {number} - Updated Y position
     */
    const addInformationalElements = (g, listInfo, currentY, totalWidth) => {
        // Add list size info message
        let infoText = listInfo.map(info => `${info.name} size: ${info.size}`).join(' | ');
        const infoY = currentY;
        const infoHeight = 24;
        const textWidth = infoText.length * 5.5;
        const infoWidth = Math.max(textWidth + 40, totalWidth * 0.8);

        createRect(g, 0, infoY, infoWidth, infoHeight, {
            fill: COLORS.primary[50],
            stroke: COLORS.primary[100],
            radius: DEFAULTS.borderRadius.sm
        });

        createText(g, 10, infoY + 16, infoText, {
            className: 'text-sm',
            color: COLORS.primary[700],
            size: 'small',
            family: 'sans'
        });

        // Adjust for info message
        currentY += infoHeight + 20;

        // Add visual indicator reference guide
        const indicatorY = currentY + LAYOUT.referenceIndicator.verticalOffset;
        const indicatorHeight = 84;
        const indicatorWidth = LAYOUT.referenceIndicator.width;

        createRect(g, 0, indicatorY, indicatorWidth, indicatorHeight, {
            fill: COLORS.objects.function.background,
            stroke: COLORS.objects.function.border,
            radius: DEFAULTS.borderRadius.md
        });

        // Title text
        createText(g, 12, indicatorY + 20, "Visual Indicators for References:", {
            className: 'text-sm font-medium',
            color: COLORS.objects.function.text,
            size: 'small',
            weight: 'semibold',
            family: 'sans'
        });

        // Reference type indicators
        const indicators = [
            { y: indicatorY + 44, text: "• [] - Represents a reference to a nested list", color: COLORS.objects.list.text },
            { y: indicatorY + 64, text: "• {} - Represents a reference to a dictionary", color: COLORS.objects.dict.text },
            { y: indicatorY + 84, text: "• fn - Represents a reference to a function", color: COLORS.objects.function.text }
        ];

        indicators.forEach(item => {
            createText(g, 24, item.y, item.text, {
                className: 'text-sm',
                color: item.color,
                size: 'small',
                family: 'sans'
            });
        });

        return indicatorY + indicatorHeight + 30;
    };

    /**
     * Updates SVG dimensions based on content height
     * @param {number} currentY - Current Y position
     */
    const updateSvgDimensions = (currentY) => {
        const height = Math.max(
            DEFAULTS.svgSize.height,
            currentY + LAYOUT.margin.top + LAYOUT.margin.bottom + 50
        );

        d3.select(svgRef.current)
            .attr('height', height)
            .attr('viewBox', [0, 0, 3000, height]);
    };

    /**
     * Calculates frame width based on variable names and values
     * @param {Object} variables - Frame variables
     * @returns {Object} - Frame width information
     */
    const calculateFrameWidth = (variables) => {
        const baseWidth = LAYOUT.frame.width;
        const baseLeftWidth = baseWidth * 0.4;
        const baseRightWidth = baseWidth * 0.6;

        // Calculate needed widths for names and values
        let maxNameLength = 0;
        let maxValueLength = 0;

        Object.entries(variables).forEach(([name, data]) => {
            maxNameLength = Math.max(maxNameLength, name.length);

            if (data?.type === 'primitive') {
                maxValueLength = Math.max(maxValueLength, String(data.value).length);
            }
        });

        // Calculate adjustments
        const leftAdjustment = maxNameLength > 8 ? (maxNameLength - 8) * 8 : 0;
        const rightAdjustment = maxValueLength > 10 ? (maxValueLength - 10) * 10 : 0;

        // Return dimensions
        const totalWidth = baseWidth + leftAdjustment + rightAdjustment;
        const leftColumnWidth = baseLeftWidth + leftAdjustment;

        return { totalWidth, leftColumnWidth };
    };

    /**
     * Draws grid lines for a frame
     * @param {d3.Selection} frameGroup - Frame group element
     * @param {Object} variables - Frame variables
     * @param {number} width - Frame width
     * @param {number} height - Frame height
     * @param {number} leftColumnWidth - Width of variables column
     */
    const drawFrameGrid = (frameGroup, variables, width, height, leftColumnWidth) => {
        const cellHeight = LAYOUT.frame.lineHeight;
        const varCount = Object.keys(variables).length;

        // Draw horizontal grid lines
        for (let i = 1; i <= varCount; i++) {
            createLine(frameGroup, 0, i * cellHeight + 35, width, i * cellHeight + 35, {
                stroke: COLORS.gray[200]
            });
        }

        // Draw vertical divider
        createLine(frameGroup, leftColumnWidth, 35, leftColumnWidth, height, {
            stroke: COLORS.gray[200]
        });
    };

    /**
     * Renders a variable in a frame
     * @param {d3.Selection} frameGroup - Frame group element
     * @param {string} name - Variable name
     * @param {Object} data - Variable data
     * @param {number} leftColumnWidth - Left column width
     * @param {number} index - Variable index
     * @param {Object} heap - Heap object
     * @param {d3.Selection} g - Main group element
     */
    const renderVariable = (frameGroup, name, data, leftColumnWidth, index, heap, g) => {
        const y = 45 + index * LAYOUT.frame.lineHeight;

        // Variable name
        createText(frameGroup, 15, y + 12, name, {
            className: 'font-mono text-base',
            color: STYLES.colors.text.primary,
            size: 'base'
        });

        if (data.type === 'primitive') {
            renderPrimitiveVariable(frameGroup, data, leftColumnWidth, y);
        } else if (data.type === 'reference' && heap[data.id]) {
            renderReferenceVariable(frameGroup, data, heap, leftColumnWidth, y, index, g);
        }
    };

    /**
     * Renders a primitive variable value
     * @param {d3.Selection} frameGroup - Frame group element
     * @param {Object} data - Variable data
     * @param {number} leftColumnWidth - Left column width
     * @param {number} y - Y position
     */
    const renderPrimitiveVariable = (frameGroup, data, leftColumnWidth, y) => {
        let valueText = data.value !== undefined && data.value !== null
            ? String(data.value)
            : '';

        // Handle empty strings
        if (valueText === '') {
            valueText = '""';
        }

        const valueWidth = valueText.length * 8 + 10;
        const primitiveColors = getObjectTypeColor('primitive');

        // Background for the value
        createRect(frameGroup, leftColumnWidth + 10, y, valueWidth, 24, {
            fill: primitiveColors.background,
            opacity: 0.6,
            radius: 4
        });

        // Value text
        createText(frameGroup, leftColumnWidth + 15, y + 16, valueText, {
            className: 'font-mono text-base',
            color: primitiveColors.text,
            size: 'base'
        });
    };

    /**
     * Renders a reference variable
     * @param {d3.Selection} frameGroup - Frame group element
     * @param {Object} data - Variable data
     * @param {Object} heap - Heap object
     * @param {number} leftColumnWidth - Left column width
     * @param {number} y - Y position
     * @param {number} index - Variable index
     * @param {d3.Selection} g - Main group element
     */
    const renderReferenceVariable = (frameGroup, data, heap, leftColumnWidth, y, index, g) => {
        const obj = heap[data.id];
        const heapPos = utils.calculateHeapObjectPosition(index, obj.type);
        const refColors = getObjectTypeColor(obj.type);

        // Reference indicator
        createRect(frameGroup, leftColumnWidth + 10, y + 2, 30, 20, {
            fill: refColors.background,
            stroke: refColors.border,
            radius: 4,
            opacity: 0.7
        });

        // Reference type text
        let refText = getRefIndicatorText(obj.type);
        createText(frameGroup, leftColumnWidth + 25, y + 16, refText, {
            className: 'font-mono text-sm font-medium',
            color: refColors.text,
            size: 'small',
            weight: 'semibold',
            anchor: 'middle'
        });

        // Draw the referenced heap object
        renderHeapObject(g, obj, heapPos, heap);

        // Draw connection
        drawConnector(g,
            { x: leftColumnWidth + 25, y: y + 22 },
            { x: heapPos.x, y: heapPos.y + 10 },
            true
        );
    };

    /**
     * Gets the indicator text for a reference type
     * @param {string} type - Object type
     * @returns {string} - Indicator text
     */
    const getRefIndicatorText = (type) => {
        switch (type) {
            case 'list': return '[]';
            case 'dict': return '{}';
            case 'function': return 'fn';
            default: return '?';
        }
    };

    /**
     * Renders a heap object based on its type
     * @param {d3.Selection} g - Main group element
     * @param {Object} obj - Heap object
     * @param {Object} pos - Position {x, y}
     * @param {Object} heap - Heap object
     */
    const renderHeapObject = (g, obj, pos, heap) => {
        switch (obj.type) {
            case 'function':
                drawFunction(g, obj, pos.x, pos.y);
                break;
            case 'list':
                drawList(g, obj.elements, pos.x, pos.y, heap);
                break;
            case 'dict':
                drawDict(g, obj.value, pos.x, pos.y);
                break;
            case 'Counter':
                drawDict(g, obj.value, pos.x, pos.y, 'Counter');
                // Add Counter-specific elements
                addCounterHighlighting(g, obj, pos);
                break;
        }
    };

    /**
     * Adds special highlighting for Counter objects
     * @param {d3.Selection} g - Main group element
     * @param {Object} obj - Counter object
     * @param {Object} pos - Position {x, y}
     */
    const addCounterHighlighting = (g, obj, pos) => {
        // Add special label for Counter
        if (obj.annotation) {
            createText(g, pos.x, pos.y - 24, obj.annotation, {
                className: 'text-xs fill-current',
                color: COLORS.objects.dict.text,
                size: 'xs',
                style: 'italic'
            });
        }

        // Add highlighting border around Counter
        const dictBounds = g.select(`rect[x="${pos.x}"][y="${pos.y}"]`);
        if (!dictBounds.empty()) {
            const width = parseFloat(dictBounds.attr('width'));
            const height = parseFloat(dictBounds.attr('height'));

            createRect(g, pos.x - 2, pos.y - 2, width + 4, height + 4, {
                fill: 'none',
                stroke: COLORS.primary[400],
                radius: DEFAULTS.borderRadius.md + 2,
                strokeWidth: 2
            }).attr('stroke-dasharray', '4,2');
        }
    };

    // =====================================================
    // Main Rendering Logic
    // =====================================================

    useEffect(() => {
        if (!svgRef.current || !executionState) return;

        // Check for import errors
        const hasImportError = detectImportError(executionState);

        // Update the Python store with error information if needed
        if (hasImportError) {
            const { setError, setExecutionSteps } = usePythonStore.getState();
            setError("This code contains imports that aren't supported in the browser environment. Try modifying the code to use built-in modules only.");
            // Clear execution steps to prevent step counter from showing
            setExecutionSteps([]);
        }

        // Clear previous visualization
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // If there's an import error, show only an error message and don't render visualization
        if (hasImportError) {
            renderImportErrorMessage(svg);
            return; // Exit early - don't render any frames or objects
        }

        // Store previous state for transitions
        const prevState = prevExecutionStateRef.current;
        prevExecutionStateRef.current = executionState;

        // Create main group with margins
        const g = svg.append('g')
            .attr('transform', `translate(${LAYOUT.margin.left},${LAYOUT.margin.top})`);

        // Set up arrow marker
        createArrow(g);

        // Only show Objects header, remove Frames header to avoid redundancy
        createText(g, LAYOUT.object.startX, 30, 'Objects', {
            family: 'sans',
            size: 'base',
            weight: 'bold',
            color: '#333333'
        });

        // Draw frames based on execution state structure
        if (executionState.frames) {
            // New frame structure
            drawCallStack(g, executionState.frames, executionState.heap);
        } else if (executionState.frame) {
            // Legacy frame structure
            drawCallStack(g, [{
                name: executionState.frame.name || 'Global frame',
                variables: executionState.frame.variables,
                is_highlighted: true
            }], executionState.heap);
        }

        // Add animations if transitioning between states
        if (prevState) {
            animateStateTransition(g);
        }
    }, [executionState]);

    /**
     * Detects if the execution state contains an import error
     * @param {Object} executionState - The current execution state
     * @returns {boolean} - True if an import error is detected
     */
    const detectImportError = (executionState) => {
        // Check in output
        if (executionState.output && (
            executionState.output.includes("not found or not supported") ||
            executionState.output.includes("ImportError")
        )) {
            return true;
        }

        // Check in frames
        if (executionState.frames) {
            return executionState.frames.some(frame =>
                (frame.variables && frame.variables.error_type) ||
                (frame.output && (
                    frame.output.includes("not found or not supported") ||
                    frame.output.includes("ImportError")
                ))
            );
        }

        // Check in single frame
        if (executionState.frame && executionState.frame.variables) {
            return Object.keys(executionState.frame.variables).includes("error_type");
        }

        return false;
    };

    /**
     * Renders an import error message in the SVG
     * @param {d3.Selection} svg - The SVG element
     */
    const renderImportErrorMessage = (svg) => {
        const errorGroup = svg.append('g')
            .attr('transform', `translate(${LAYOUT.margin.left},${LAYOUT.margin.top + 50})`);

        const width = Math.min(600, svgRef.current.clientWidth - 80);
        const height = 150;

        // Error container
        createRect(errorGroup, 0, 0, width, height, {
            fill: COLORS.state.error[50],
            stroke: COLORS.state.error[100],
            radius: DEFAULTS.borderRadius.lg,
            strokeWidth: 2
        });

        // Error icon (can be replaced with an actual icon if needed)
        const iconSize = 40;
        const iconX = 30;
        const iconY = 30;

        createRect(errorGroup, iconX, iconY, iconSize, iconSize, {
            fill: COLORS.state.error[100],
            radius: iconSize / 2
        });

        // Error title
        createText(errorGroup, iconX + iconSize + 20, iconY + 15, "Import Error", {
            size: 'lg',
            weight: 'bold',
            color: COLORS.state.error[600],
            family: 'sans'
        });

        // Error message
        const messages = [
            "This code contains imports that aren't supported in the browser environment.",
            "Module 'requests' cannot be imported in this Python Tutor visualization.",
            "Try modifying the code to use built-in modules only."
        ];

        messages.forEach((msg, idx) => {
            createText(errorGroup, 30, iconY + 60 + (idx * 22), msg, {
                size: 'base',
                color: COLORS.state.error[500],
                family: 'sans'
            });
        });

        // Update SVG height to fit error message
        svg.attr('height', height + 100);
    };

    /**
     * Animates state transitions
     * @param {d3.Selection} g - Main group element
     */
    const animateStateTransition = (g) => {
        // Fade in frames
        g.selectAll('.frame')
            .style('opacity', 0)
            .transition()
            .duration(300)
            .style('opacity', 1);

        // Animate connections
        g.selectAll('path[marker-end]')
            .style('stroke-dasharray', function () {
                const length = this.getTotalLength();
                return `${length} ${length}`;
            })
            .style('stroke-dashoffset', function () {
                return this.getTotalLength();
            })
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .style('stroke-dashoffset', 0);
    };

    return (
        <div className="w-full h-full">
            <div
                ref={containerRef}
                className="h-full"
                style={{
                    overflow: 'auto',
                    maxWidth: '100%',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${COLORS.gray[400]} transparent`,
                }}>
                <svg
                    ref={svgRef}
                    width="3000px"
                    height={DEFAULTS.svgSize.height}
                    preserveAspectRatio="xMinYMin meet"
                >
                    {/* Visualization will be rendered here */}
                </svg>
            </div>

            {/* Global styles for scrollbars */}
            <style>
                {`
                    /* Ensures parent containers don't create additional scrollbars */
                    .min-h-0.overflow-auto.border-b.border-gray-100 {
                        overflow-x: hidden !important;
                    }
                    
                    /* Styling for scrollbars */
                    div::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                    }
                    div::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    div::-webkit-scrollbar-thumb {
                        background-color: #D1D5DB;
                        border-radius: 20px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                        background-color: #9CA3AF;
                    }
                `}
            </style>
        </div>
    );
};

export default PythonTutorViz;