# StepViz

A Python code visualization tool that allows you to step through algorithm execution, visualize variables and object references, and analyze code complexity.

## Features

- Step-by-step Python code execution visualization
- Visualization of variables, heap objects, and references
- Automatic complexity analysis of algorithms
- AI-powered algorithm explanations
- Interactive controls for stepping through code
- Modern, responsive UI

## Tech Stack

- **Frontend**: React, Tailwind CSS, Monaco Editor
- **Visualization**: D3.js
- **Python Execution**: Pyodide (Python in WebAssembly)
- **AI Analysis**: DeepSeek AI via OpenRouter API

## Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/stepviz.git
   cd stepviz
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenRouter API key
   ```
   OPENROUTER_API_KEY=your_key_here
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. In a separate terminal, start the algorithm analysis API
   ```
   node algorithm-analysis-api.js
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter or paste Python code in the editor
2. Click "Run Code" to execute and visualize
3. Use the controls to step through execution
4. Expand the "Algorithm Explanation" panel for AI-generated explanations

## Troubleshooting

- **Visualization not rendering**: Make sure you have JavaScript enabled and are using a modern browser
- **API errors**: Verify your API key is correctly set in the .env file
- **Python execution issues**: Currently supports a subset of Python standard library; some modules like numpy are not available

## Acknowledgments

- [Python Tutor](https://pythontutor.com/) for inspiration

- [Pyodide](https://pyodide.org/) for Python in the browser capabilities

-[DeepSeekAI](https://www.deepseek.com/en) for algorithm analysis capabilities

## Screenshots

![UI](https://github.com/user-attachments/assets/a0fbbe0a-0b3c-426b-9477-61407702f9e9)

*Main interface with code editor and visualization*

---
