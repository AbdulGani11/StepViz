import { useEffect, useState } from 'react';
import { pythonService } from './services/PythonService';
import CodeEditor from './components/CodeEditor';
import AlgorithmVisualizer from './components/AlgorithmVisualizer';

const App = () => {
  const [code, setCode] = useState('');

  useEffect(() => {
    pythonService.initialize();
  }, []);

  // Simple fix to ensure same exact height
  const editorHeight = "780px";

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-[1560px] mx-auto px-4 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div style={{ height: editorHeight }}>
            <CodeEditor onCodeChange={setCode} />
          </div>
          <div style={{ height: editorHeight }}>
            <AlgorithmVisualizer code={code} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;