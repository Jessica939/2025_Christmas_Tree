import React from 'react';
import { useAppStore } from '../context';
import { AppMode } from '../types';

export const UI: React.FC = () => {
  const { mode, gestureState } = useAppStore();

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] tracking-wider">
          MERRY CHRISTMAS
        </h1>
      </div>

      {/* Instructions */}
      <div className="flex flex-col items-start space-y-4">
        <div className={`transition-all duration-500 transform ${mode === AppMode.TREE ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-50'}`}>
            <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-md p-3 rounded-r-xl border-l-4 border-purple-500">
                <div className="text-2xl">✊</div>
                <div className="text-white text-sm">
                    <span className="font-bold block text-purple-300">PINCH / FIST</span>
                    ASSEMBLE TREE
                </div>
            </div>
        </div>

        <div className={`transition-all duration-500 transform ${mode === AppMode.EXPLODE ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-50'}`}>
            <div className="flex items-center space-x-3 bg-black/40 backdrop-blur-md p-3 rounded-r-xl border-l-4 border-pink-500">
                <div className="text-2xl">🖐️</div>
                <div className="text-white text-sm">
                    <span className="font-bold block text-pink-300">OPEN HAND</span>
                    EXPLODE & ROTATE
                </div>
            </div>
        </div>
      </div>

      {/* Status Bar Removed */}
      
      {/* Custom Cursor Feedback */}
      <CursorFollower />
    </div>
  );
};

const CursorFollower: React.FC = () => {
    const { gestureState } = useAppStore();
    const cursorRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const update = () => {
            if (cursorRef.current && gestureState.current.isHandDetected) {
                // Mirror X because camera is mirrored
                const x = (1 - gestureState.current.handPosition.x) * window.innerWidth;
                const y = gestureState.current.handPosition.y * window.innerHeight;
                cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
                cursorRef.current.style.opacity = '1';
                cursorRef.current.style.borderColor = gestureState.current.gesture === 'OPEN_PALM' ? '#ec4899' : '#a855f7';
            } else if (cursorRef.current) {
                cursorRef.current.style.opacity = '0';
            }
            requestAnimationFrame(update);
        };
        const handle = requestAnimationFrame(update);
        return () => cancelAnimationFrame(handle);
    }, [gestureState]);

    return (
        <div 
            ref={cursorRef}
            className="fixed top-0 left-0 w-8 h-8 border-2 rounded-full pointer-events-none z-50 transition-colors duration-200 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            style={{ opacity: 0 }}
        />
    )
}