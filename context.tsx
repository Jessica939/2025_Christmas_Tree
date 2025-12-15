import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AppMode, HandGestureState } from './types';

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  gestureState: React.MutableRefObject<HandGestureState>;
  rotationOffset: React.MutableRefObject<number>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>(AppMode.TREE);
  
  // We use refs for high-frequency updates (animation loop) to avoid React re-renders
  const gestureState = useRef<HandGestureState>({
    isHandDetected: false,
    gesture: 'UNKNOWN',
    handPosition: { x: 0.5, y: 0.5 },
  });
  
  const rotationOffset = useRef<number>(0);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === AppMode.TREE ? AppMode.EXPLODE : AppMode.TREE));
  }, []);

  return (
    <AppContext.Provider value={{ mode, setMode, toggleMode, gestureState, rotationOffset }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};