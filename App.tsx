import React from 'react';
import { AppProvider } from './context';
import InteractiveScene from './components/Scene';
import { UI } from './components/UI';
import { GestureInput } from './components/GestureInput';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="relative w-screen h-screen bg-[#050103] overflow-hidden">
        {/* 3D Scene Layer */}
        <div className="absolute inset-0 z-0">
          <InteractiveScene />
        </div>

        {/* UI Overlay Layer */}
        <UI />

        {/* AI Input Layer */}
        <GestureInput />
      </div>
    </AppProvider>
  );
};

export default App;