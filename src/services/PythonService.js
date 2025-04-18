import { create } from 'zustand';

// =====================================================
// Store for managing user input prompts
// =====================================================
export const useInputStore = create((set) => ({
    isInputOpen: false,
    inputPrompt: '',
    inputResolver: null,

    openInputPrompt: (prompt, resolver) => set({
        isInputOpen: true,
        inputPrompt: prompt,
        inputResolver: resolver
    }),

    closeInputPrompt: () => set({
        isInputOpen: false,
        inputPrompt: '',
        inputResolver: null
    }),

    submitInput: (value) => set((state) => {
        if (state.inputResolver) {
            state.inputResolver(value);
        }
        return {
            isInputOpen: false,
            inputPrompt: '',
            inputResolver: null
        };
    })
}));

// =====================================================
// Store for managing Python execution state
// =====================================================
export const usePythonStore = create((set) => ({
    isInitialized: false,
    isRunning: false,
    error: null,
    executionSteps: [],
    currentStepIndex: 0,
    executionState: {
        frame: {
            variables: {}
        },
        heap: {},
        output: '',
        currentLine: 1
    },

    // Actions for updating state
    setExecutionState: (state) => set((prev) => ({
        executionState: { ...prev.executionState, ...state }
    })),

    setExecutionSteps: (steps) => set({ executionSteps: steps }),

    setCurrentStepIndex: (index) => set((prev) => {
        if (index >= 0 && index < prev.executionSteps.length) {
            const currentStep = prev.executionSteps[index];
            const lastStep = prev.executionSteps[prev.executionSteps.length - 1];
            return {
                currentStepIndex: index,
                executionState: {
                    ...currentStep,
                    output: lastStep?.output || ''
                }
            };
        }
        return prev;
    }),

    setError: (error) => set({ error }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setIsInitialized: (isInitialized) => set({ isInitialized })
}));

// =====================================================
// Python setup and tracing code (extracted for readability)
// =====================================================

// Initial Python setup code
const PYTHON_SETUP_CODE = `
import sys
import json
from pyodide.ffi import to_js

# Custom import handling with simpler error message
import builtins
real_import = builtins.__import__

def custom_import(name, *args, **kwargs):
    unsupported_modules = ['numpy', 'np', 'pandas', 'pd', 'matplotlib', 'plt', 'scipy', 'sk', 'sklearn', 'requests']
    
    if name.lower() in unsupported_modules:
        if name.lower() == 'requests':
            raise ImportError("requests not found or not supported - Only these modules can be imported: **future**, abc, array, bisect, calendar, cmath, collections, copy, datetime, decimal, doctest, fractions, functools, hashlib, heapq, io, itertools, json, locale, math, operator, pickle, pprint, random, re, string, types, typing, unittest")
        else:
            raise ImportError(f"Module '{name}' is not supported in this environment. Please use standard Python libraries only.")
    return real_import(name, *args, **kwargs)

builtins.__import__ = custom_import

execution_steps = []
`;

// VisualizerState class definition for tracking Python execution
const VISUALIZER_STATE_CODE = `
class VisualizerState:
    def __init__(self):
        self.heap = {}
        self.next_heap_id = 1
        self.output = ""

    def get_heap_id(self):
        id = self.next_heap_id
        self.next_heap_id += 1
        return f"id{id}"

    def process_value(self, val):
        # Ignore module objects completely
        if hasattr(val, '__file__') and hasattr(val, '__name__'):
            # This is likely a module, just return a simplified representation
            return {
                "type": "primitive",
                "value": f"<module '{val.__name__}'>"
            }
        
        # Special handling for numeric values, including size=8
        if isinstance(val, (int, float)):
            return {
                "type": "primitive",
                "value": str(val)  # Force conversion to string
            }
        elif isinstance(val, bool) or val is None:
            return {
                "type": "primitive",
                "value": str(val) if val is not None else "None"
            }
        elif isinstance(val, str):
            return {
                "type": "primitive",
                "value": val
            }
        elif isinstance(val, tuple):
            heap_id = self.get_heap_id()
            elements = [self.process_value(x) for x in val]
            self.heap[heap_id] = {
                "type": "list",
                "objectType": "tuple",
                "elements": elements
            }
            return {"type": "reference", "id": heap_id}
        elif isinstance(val, list):
            heap_id = self.get_heap_id()
            elements = [self.process_value(x) for x in val]
            self.heap[heap_id] = {
                "type": "list",
                "objectType": "list",
                "elements": elements
            }
            return {"type": "reference", "id": heap_id}
        elif isinstance(val, dict):
            heap_id = self.get_heap_id()
            self.heap[heap_id] = {
                "type": "dict",
                "value": {
                    str(k): self.process_value(v)["value"] if isinstance(v, (int, float, bool, str)) else str(v)
                    for k, v in val.items()
                }
            }
            return {"type": "reference", "id": heap_id}
        elif callable(val):
            heap_id = self.get_heap_id()
            try:
                params = val.__code__.co_varnames[:val.__code__.co_argcount]
                signature = f"{val.__name__}({', '.join(params)})"
            except AttributeError:
                signature = val.__name__
            
            self.heap[heap_id] = {
                "type": "function",
                "name": val.__name__,
                "value": signature
            }
            return {"type": "reference", "id": heap_id}
        # Handle Counter objects specially
        elif hasattr(val, '__class__') and val.__class__.__name__ == 'Counter':
            # Always create a unique heap ID for Counter objects
            heap_id = self.get_heap_id()
            
            # Store the Counter with a clear label to distinguish it
            var_name = self._get_variable_name(val) if hasattr(self, '_get_variable_name') else None
            label = f"Counter for {var_name}" if var_name else "Counter object"
            
            self.heap[heap_id] = {
                "type": "Counter",  # Use Counter type, not dict type
                "value": {
                    str(k): str(v) for k, v in val.items()
                },
                "annotation": label,
                # Add a unique identifier to ensure separate visualization
                "_object_id": id(val)  # Use Python's object ID to track unique instances
            }
            return {"type": "reference", "id": heap_id}
        # Handle iterators - simplify their representation completely
        elif hasattr(val, '__iter__') and hasattr(val, '__next__'):
            return {
                "type": "primitive",
                "value": "iterator"
            }
        # Handle regex objects
        elif hasattr(val, '__class__') and val.__class__.__name__ == 'Pattern':
            return {
                "type": "primitive",
                "value": f"regex: {val.pattern}"
            }
        
        # Default case
        return {
            "type": "primitive",
            "value": str(val)
        }

    def _get_variable_name(self, obj):
        """Try to find variable name for an object by scanning frame locals"""
        for frame in execution_steps:
            if frame and frame.get("frame") and frame["frame"].get("variables"):
                for name, val in frame["frame"]["variables"].items():
                    if val and val.get("type") == "reference" and val.get("id"):
                        heap_obj = self.heap.get(val["id"])
                        if heap_obj and heap_obj.get("_object_id") == id(obj):
                            return name
        return None

    def capture_frame(self, frame):
        """Capture and process a frame for visualization"""
        # Create the frame info structure
        frame_info = {
            "frame": {
                "name": frame.f_code.co_name if frame.f_code.co_name != '<module>' else 'Global frame',
                "variables": {}
            },
            "heap": self.heap,
            "output": get_output(),
            "currentLine": frame.f_lineno
        }
        
        # For global frame, only include user-defined variables
        if frame.f_code.co_name == '<module>':
            # Filter variables to only show the ones we want
            for name, val in frame.f_globals.items():
                # Skip all internal/system variables
                if (name.startswith('__') or 
                    name in ['sys', 'json', 'builtins', 'custom_import', 'visualization', 'visualizer'] or
                    name.startswith('_')):
                    continue
                    
                # Include only specific important variables
                if name in ['Counter', 'winner', 'input'] or not name.startswith(('get_', 'set_', 'run_', 'trace_')):
                    frame_info["frame"]["variables"][name] = self.process_value(val)
        else:
            # For other frames, include most local variables but still filter system ones
            for name, val in frame.f_locals.items():
                if name.startswith('__') or name in ['self', 'cls']:
                    continue
                frame_info["frame"]["variables"][name] = self.process_value(val)
        
        return frame_info

visualizer = VisualizerState()
`;

// Output capturing and execution tracing
const OUTPUT_AND_TRACING_CODE = `
class OutputCapturer:
    def __init__(self):
        self.value = ""
    
    def write(self, text):
        self.value += text
        sys.__stdout__.write(text)
    
    def flush(self):
        sys.__stdout__.flush()

capturer = OutputCapturer()
sys.stdout = capturer

def get_output():
    return capturer.value

def create_error_state(error_type, error_msg):
    """Create and add an error state to execution steps"""
    full_message = f"{error_type}: {error_msg}"
    print(full_message)
    state = {
        "frame": {"name": "Global frame", "variables": {}}, 
        "heap": {}, 
        "output": full_message, 
        "currentLine": 1
    }
    execution_steps.append(state)

def filter_system_variables(variables_dict):
    """Filter out system variables from a variables dictionary"""
    filtered = {}
    for name, value in variables_dict.items():
        if not name.startswith('__') and name not in [
            'custom_import', 'real_import', 'unsupported_modules',
            'builtins', 'json', 'sys', 'to_js', 'visualizer',
            'execution_steps', 'trace_execution', 'run_with_trace',
            'create_error_state', 'filter_system_variables']:
            filtered[name] = value
    return filtered

# Track generator expression current item
def trace_execution(frame, event, arg):
    # Skip frames that contain custom_import or other system frames
    if (frame.f_code.co_name in ['custom_import', '__import__'] or
        'custom_import' in frame.f_locals or
        frame.f_globals.get('__name__', '').startswith(('re', 'collections', 'importlib'))):
        return trace_execution
    
    # Capture main script execution
    if event == 'line' and frame.f_globals.get('__name__') == '__main__':
        # Always capture at least one frame from the main script to ensure output display
        # but avoid duplicate frames for the same line
        
        # If we already have steps and this is the same line as the last step, skip
        if (len(execution_steps) > 0 and 
            execution_steps[-1].get("currentLine") == frame.f_lineno and
            frame.f_code.co_name == '__main__'):
            return trace_execution
        
        # Capture frame regardless of variables for output display
        state = visualizer.capture_frame(frame)
        execution_steps.append(state)
    
    return trace_execution
`;

// Code execution function
const RUN_WITH_TRACE_CODE = `
def run_with_trace(code):
    try:
        visualizer.heap = {}
        visualizer.next_heap_id = 1
        capturer.value = ""
        execution_steps.clear()
        
        # Initialize with __name__ set to __main__
        namespace = {'__name__': '__main__'}
        
        # Run the code with tracing
        sys.settrace(trace_execution)
        try:
            exec(code, namespace)
        except ImportError as e:
            create_error_state("Error", str(e))
        except KeyError as e:
            create_error_state("KeyError", str(e))
        except Exception as e:
            create_error_state("Error", str(e))
        sys.settrace(None)
        
        # Post-process: Strip out unwanted objects from all steps
        for step_idx, step in enumerate(execution_steps):
            # 1. Filter global frame variables
            if step and step.get("frame") and step["frame"].get("variables"):
                step["frame"]["variables"] = filter_system_variables(step["frame"]["variables"])
            
            # 2. Filter heap objects
            if step and step.get("heap"):
                # Identify heap objects to remove (those referenced by unwanted variables)
                objects_to_remove = []
                for obj_id, obj in step["heap"].items():
                    # Remove dictionaries with __name__ and __builtins__
                    if obj.get("type") == "dict" and obj.get("value"):
                        keys = list(obj["value"].keys())
                        if "__name__" in keys or "__builtins__" in keys:
                            objects_to_remove.append(obj_id)
                
                # Remove the unwanted objects
                for obj_id in objects_to_remove:
                    if obj_id in step["heap"]:
                        del step["heap"][obj_id]
        
        # Process final state if no steps were captured
        if len(execution_steps) == 0:
            frame = sys._getframe()
            state = visualizer.capture_frame(frame)
            
            # Apply same filtering to this frame
            if state and state.get("frame") and state["frame"].get("variables"):
                state["frame"]["variables"] = filter_system_variables(state["frame"]["variables"])
            
            execution_steps.append(state)
        
        # Special enhancement for Counter
        for step in execution_steps:
            # Add annotation to Counter in heap
            for obj_id, obj in step.get("heap", {}).items():
                if obj.get("type") == "Counter" or (obj.get("value") and "Counter" in str(obj.get("value"))):
                    obj["annotation"] = "imported class Counter"
        
        final_output = get_output()
        for step in execution_steps:
            step["output"] = final_output
        
        # Duplicate step if only one exists to make sure visualization works
        if len(execution_steps) == 1:
            execution_steps.append(execution_steps[0])
        
        return to_js(execution_steps)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.settrace(None)
        return to_js([])
    finally:
        sys.stdout = sys.__stdout__
`;

// Input handling code
const INPUT_HANDLING_CODE = `
import builtins
from js import handlePythonInput

original_input = builtins.input

def custom_input(prompt=""):
    # Print the prompt
    if prompt:
        print(prompt, end="")
    
    # Call the JavaScript input handler
    result = handlePythonInput(prompt)
    
    # Echo the input
    print(result)
    return result

builtins.input = custom_input
`;

// =====================================================
// Main Python service class
// =====================================================
class PythonService {
    pyodide = null;
    isCodeRunning = false;

    /**
     * Initialize Pyodide and set up the Python execution environment
     */
    async initialize() {
        const store = usePythonStore.getState();
        if (store.isInitialized) return;

        try {
            store.setIsRunning(true);
            console.log('Initializing Pyodide...');

            // Load Pyodide with stdout redirection
            this.pyodide = await window.loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/",
                stdout: (text) => {
                    console.log('Python output:', text);
                    store.setExecutionState(prev => ({
                        ...prev,
                        output: prev.output + text + '\n'
                    }));
                }
            });

            // Run the setup code in sequence
            await this.pyodide.runPythonAsync(PYTHON_SETUP_CODE);
            await this.pyodide.runPythonAsync(VISUALIZER_STATE_CODE);
            await this.pyodide.runPythonAsync(OUTPUT_AND_TRACING_CODE);
            await this.pyodide.runPythonAsync(RUN_WITH_TRACE_CODE);

            // Set up the input handler
            this.setupInputHandler();
            await this.pyodide.runPythonAsync(INPUT_HANDLING_CODE);

            store.setIsInitialized(true);
            console.log('Pyodide initialized successfully');
        } catch (error) {
            console.error('Pyodide initialization error:', error);
            store.setError(error.message);
        } finally {
            store.setIsRunning(false);
        }
    }

    /**
     * Set up the input handler for Python code execution
     */
    setupInputHandler() {
        // Create a SELF-CONTAINED input handler function that captures this instance
        const pythonService = this;

        window.handlePythonInput = function (prompt) {
            // Reference the captured service instance
            if (!pythonService.isCodeRunning) {
                console.warn("Input requested outside of execution context");
                return "INPUT_DISABLED";
            }

            const userInput = window.prompt(prompt || "Input required:", "");
            return userInput || "";
        };
    }

    /**
     * Process list elements for better display
     * @param {Array} steps - The execution steps to process
     */
    formatListElements(steps) {
        steps.forEach(step => {
            if (!step.heap) return;

            // Process all heap objects
            Object.keys(step.heap).forEach(heapId => {
                const obj = step.heap[heapId];

                // Only process lists
                if (obj && obj.type === 'list' && Array.isArray(obj.elements)) {
                    obj.elements.forEach(element => {
                        // Only process primitive string values
                        if (element.type === 'primitive' && typeof element.value === 'string') {
                            // Ensure the value is properly formatted for visualization
                            element.value = String(element.value);
                        }
                    });
                }
            });
        });
    }

    /**
     * Run Python code and update execution state
     * @param {string} code - The Python code to execute
     */
    async runCode(code) {
        if (!this.pyodide) throw new Error('Python not initialized');
        const store = usePythonStore.getState();

        try {
            // Set the flag BEFORE running the Python code
            console.log("Setting code running state to true");
            this.isCodeRunning = true;
            store.setIsRunning(true);
            store.setError(null);

            // Reset execution state
            this.resetExecutionState(store);

            // Properly escape code for Python execution
            const escapedCode = this.escapeCodeForPython(code);

            // DEBUG: Verify the flag before execution
            console.log("isCodeRunning before execution:", this.isCodeRunning);

            // Run the code and get execution steps
            const steps = await this.pyodide.runPythonAsync(`run_with_trace('''${escapedCode}''')`);

            // Process execution steps if any were returned
            if (steps && steps.length > 0) {
                this.processExecutionSteps(steps, store);
            }
        } catch (error) {
            console.error('Python execution error:', error);
            store.setError(error.message);
        } finally {
            // Reset the flag AFTER execution
            console.log("Setting code running state to false");
            this.isCodeRunning = false;
            store.setIsRunning(false);
        }
    }

    /**
     * Reset the execution state before running new code
     * @param {Object} store - The Python store instance
     */
    resetExecutionState(store) {
        store.setExecutionState({
            frame: { variables: {} },
            heap: {},
            output: '',
            currentLine: 1
        });
        store.setExecutionSteps([]);
        store.setCurrentStepIndex(0);
    }

    /**
     * Escape code for embedding in Python string
     * @param {string} code - The code to escape
     * @returns {string} - Escaped code
     */
    escapeCodeForPython(code) {
        return code.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    }

    /**
     * Process and filter execution steps from Python
     * @param {Array} steps - Raw execution steps from Python
     * @param {Object} store - The Python store instance
     */
    processExecutionSteps(steps, store) {
        // Filter out internal steps and OutputCapturer write steps
        const relevantSteps = steps.filter(step =>
            step.frame &&
            step.frame.variables &&
            !step.frame.variables._pyodide_core &&
            !step.frame.variables.OutputCapturer &&
            !step.frame.variables.capturer &&
            !step.frame.variables.trace_execution &&
            !step.frame.variables.run_with_trace &&
            step.frame.name !== 'write'  // Filter out OutputCapturer write steps
        );

        if (relevantSteps.length > 0) {
            // Process steps before updating state
            this.formatListElements(relevantSteps);

            // Update the state with processed steps
            store.setExecutionSteps(relevantSteps);
            store.setExecutionState({
                ...relevantSteps[0],
                output: steps[steps.length - 1]?.output || ''
            });
        }
    }
}

// Create a singleton instance for the application
export const pythonService = new PythonService();