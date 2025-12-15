import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useAppStore } from '../context';
import { AppMode } from '../types';

export const GestureInput: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setMode, gestureState, rotationOffset } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Camera Management
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const lastVideoTime = useRef(-1);
  const animationFrameId = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  // Initialize MediaPipe and Initial Camera
  useEffect(() => {
    let isActive = true;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        if (!isActive) return;

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (!isActive) return;
        
        // Start with default camera first to get permissions
        await startWebcam();
        
        // After permission is granted, we can list all devices with labels
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        if (isActive) {
            setDevices(videoDevices);
            setLoading(false);
        }

      } catch (err) {
        console.error(err);
        if (isActive) {
            setError("AI Init Failed");
            setLoading(false);
        }
      }
    };

    setupMediaPipe();

    return () => {
      isActive = false;
      stopCamera();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      handLandmarkerRef.current?.close();
    };
  }, []);

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(track => track.stop());
         videoRef.current.srcObject = null;
      }
  };

  const startWebcam = async (deviceId?: string) => {
    try {
      stopCamera();

      const constraints = { 
          video: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              width: 320,
              height: 240,
              frameRate: { ideal: 30 }
          } 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      if (err.name === 'NotFoundError' || err.message?.includes('No video input')) {
          setError("No Camera Found");
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Camera Denied");
      } else {
          setError("Camera Error");
      }
    }
  };

  const handleSwitchCamera = useCallback(async () => {
      if (devices.length < 2) return;
      
      const nextIndex = (currentDeviceIndex + 1) % devices.length;
      setCurrentDeviceIndex(nextIndex);
      
      setLoading(true);
      await startWebcam(devices[nextIndex].deviceId);
      setLoading(false);
  }, [devices, currentDeviceIndex]);

  const predictWebcam = () => {
      if (!handLandmarkerRef.current || !videoRef.current) return;

      const video = videoRef.current;
      // Ensure video is actually playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
          animationFrameId.current = requestAnimationFrame(predictWebcam);
          return;
      }

      const startTimeMs = performance.now();

      if (lastVideoTime.current !== video.currentTime) {
        lastVideoTime.current = video.currentTime;
        try {
            const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

            const ctx = canvasRef.current?.getContext('2d');
            if (canvasRef.current && ctx) {
                canvasRef.current.width = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
                ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
            }

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                
                // Draw visual feedback
                if (ctx) {
                    ctx.fillStyle = '#8170fc';
                    for (const point of landmarks) {
                        ctx.beginPath();
                        ctx.arc(point.x * video.videoWidth, point.y * video.videoHeight, 3, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }

                // Gesture Logic
                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];
                const wrist = landmarks[0];

                // Pinch detection
                const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
                
                // Openness detection
                const avgDistFromWrist = (
                    Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y) +
                    Math.hypot(landmarks[12].x - wrist.x, landmarks[12].y - wrist.y) +
                    Math.hypot(landmarks[16].x - wrist.x, landmarks[16].y - wrist.y) +
                    Math.hypot(landmarks[20].x - wrist.x, landmarks[20].y - wrist.y)
                ) / 4;

                let detectedGesture: 'CLOSED_FIST' | 'OPEN_PALM' | 'UNKNOWN' = 'UNKNOWN';

                if (pinchDist < 0.05 || avgDistFromWrist < 0.2) {
                    detectedGesture = 'CLOSED_FIST';
                    setMode(AppMode.TREE);
                } else if (avgDistFromWrist > 0.35) {
                    detectedGesture = 'OPEN_PALM';
                    setMode(AppMode.EXPLODE);
                }

                gestureState.current = {
                    isHandDetected: true,
                    gesture: detectedGesture,
                    handPosition: { x: landmarks[9].x, y: landmarks[9].y }
                };

                if (detectedGesture === 'OPEN_PALM') {
                    const panX = (landmarks[9].x - 0.5) * 2; 
                    rotationOffset.current = panX * 0.05; 
                } else {
                    rotationOffset.current = 0;
                }

            } else {
                gestureState.current.isHandDetected = false;
                rotationOffset.current = 0;
            }
        } catch (e) {
            console.error("Prediction error", e);
        }
      }

      animationFrameId.current = requestAnimationFrame(predictWebcam);
  };

  // UI Render
  if (error) {
      return (
        <div className="fixed bottom-4 right-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-[10px] text-red-200 backdrop-blur-md">
            ⚠️ {error} (Mouse mode only)
        </div>
      );
  }

  return (
    <div className={`fixed bottom-4 right-4 group`}>
        {/* Switch Camera Button - Only shows if multiple devices */}
        {devices.length > 1 && (
            <button 
                onClick={handleSwitchCamera}
                className="absolute -top-8 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md border border-white/10 hover:bg-purple-600/80 transition-colors z-50 pointer-events-auto"
            >
                📷 Switch Cam
            </button>
        )}

        <div className={`w-32 h-24 bg-black/40 border border-purple-500/20 rounded-lg overflow-hidden backdrop-blur-sm shadow-lg z-50 transition-all duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {loading && <div className="absolute inset-0 flex items-center justify-center text-[9px] text-purple-200/50 animate-pulse">INIT AI...</div>}
            
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-40 mix-blend-screen" 
            />
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-60"
            />
        </div>
    </div>
  );
};