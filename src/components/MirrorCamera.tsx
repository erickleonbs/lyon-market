'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera as CameraIcon, RefreshCcw, ScanFace, Lock } from 'lucide-react';
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { CountdownOverlay } from './CountdownOverlay';

// --- SETTINGS (ADJUST HERE) ---
const CAPTURE_DELAY_SECONDS = 5; // How long to wait before seeking snap
const DETECTION_THRESHOLD = 0.6; // How confident the AI must be (0.0 - 1.0)
const DEBOUNCE_MS = 1000; // How long to wait before resetting if person is lost

// Detection Criteria
const CENTER_TOLERANCE = 0.2; // +/- 20% from center X

// --- CAMERA CONFIGURATION ---
const CAMERA_CONFIG = {
    ideal: {
        width: { ideal: 1200 }, // 4:3 Aspect Ratio (1440x1920)
        height: { ideal: 1600 },
        facingMode: 'user'
    }
};

interface MirrorCameraProps {
    onCapture: (imageData: string) => void;
    onError?: (error: string) => void;
    onClose?: () => void;
}

export function MirrorCamera({ onCapture, onError, onClose }: MirrorCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

    // Detection State
    const [detector, setDetector] = useState<ObjectDetector | null>(null);
    const [isPersonDetected, setIsPersonDetected] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isLooping, setIsLooping] = useState(false); // Visual debug

    // Refs for Loop Control
    const shouldDetectRef = useRef(false);
    const detectionRef = useRef<{
        lastDetectionTime: number;
        personPresent: boolean;
        timerId: NodeJS.Timeout | null
    }>({
        lastDetectionTime: 0,
        personPresent: false,
        timerId: null
    });

    // 1. Initialize MediaPipe Detector
    useEffect(() => {
        const initDetector = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
                );
                const objectDetector = await ObjectDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite", // Use CDN URL
                        delegate: "CPU"
                    },
                    scoreThreshold: DETECTION_THRESHOLD,
                    runningMode: "IMAGE"
                });
                setDetector(objectDetector);
                console.log("[MediaPipe] Detector loaded successfully");
            } catch (err: any) {
                console.error("[MediaPipe] Failed to load detector:", err);
                setError("Failed to load AI model");
                if (onError) onError(err.message);
            }
        };
        initDetector();
    }, [onError]);

    // Camera State
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // 2. Start Camera
    const startCamera = useCallback(async (mode: 'user' | 'environment' = 'user') => {
        setError(null);
        setFacingMode(mode);

        // Stop existing tracks
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            console.log(`[Camera] Starting with mode: ${mode}`);
            const config = {
                ...CAMERA_CONFIG.ideal,
                facingMode: mode
            };

            const stream = await navigator.mediaDevices.getUserMedia({
                video: config,
                audio: false,
            });
            handleStream(stream);
        } catch (err: any) {
            console.warn('[Camera] Failed:', err);
            handleError(err);
        }
    }, []);

    const switchCamera = () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        startCamera(newMode);
    };

    function handleStream(stream: MediaStream) {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setPermissionStatus('granted');

            videoRef.current.onloadeddata = () => {
                console.log("[Camera] Stream ready. Enabling detection.");
                startDetectionLoop();
            };
        }
    }

    function handleError(err: any) {
        setPermissionStatus('denied');
        setError(err.message || "Camera access failed");
        if (onError) onError(err.message || "Camera access failed");
    }

    // 3. Robust Detection Loop
    const startDetectionLoop = useCallback(() => {
        shouldDetectRef.current = true;
        setIsLooping(true);
        predictLoop();
    }, [detector]);

    const predictLoop = () => {
        if (!shouldDetectRef.current) {
            setIsLooping(false);
            return;
        }

        if (!videoRef.current || !detector || !videoRef.current.videoWidth || !videoRef.current.videoHeight || videoRef.current.readyState < 2) {
            // Wait for video to be ready
            requestAnimationFrame(predictLoop);
            return;
        }

        const now = Date.now();
        if (now - detectionRef.current.lastDetectionTime < 200) { // Throttle: 5fps max
            requestAnimationFrame(predictLoop);
            return;
        }

        try {
            // Safer: Draw to canvas first
            const video = videoRef.current;
            const canvas = document.createElement('canvas'); // Temp canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Detect on canvas (more stable especially on mobile/safari)
            const detections = detector.detect(canvas);

            const person = detections.detections.find(d =>
                d.categories.some(c => c.categoryName === 'person' && c.score > DETECTION_THRESHOLD)
            );

            const detectionTime = Date.now();

            if (person && person.boundingBox) {
                const box = person.boundingBox;
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;

                // Normalized Coords (0.0 - 1.0)
                const centerX = (box.originX + (box.width / 2)) / videoWidth;
                const yMin = box.originY / videoHeight;
                const height = box.height / videoHeight;
                const yMax = yMin + height;

                // --- POSITION CHECKS ---
                let feedback = "";

                // 1. Centering (Mirror Logic: Left on screen = Left in reality -> Move Right to center)
                const isCentered = Math.abs(centerX - 0.5) < CENTER_TOLERANCE;

                // 2. Full Body Constraints
                const headVisible = yMin > 0.01; // Not touching top edge
                const feetVisible = yMax < 0.99; // Not touching bottom edge
                const isTooSmall = height < 0.3; // Too far
                const isTooBig = height > 0.85; // Too close

                if (isTooSmall) {
                    feedback = "Acércate más";
                } else if (isTooBig) {
                    feedback = "Aléjate un poco";
                } else if (!headVisible || !feetVisible) {
                    feedback = "Aléjate para cuerpo completo";
                } else if (!isCentered) {
                    // Mirror logic correction
                    feedback = centerX < 0.5 ? "Muévete a la derecha ➡️" : "⬅️ Muévete a la izquierda";
                }

                if (feedback === "") {
                    // Valid!
                    setFeedbackMessage(null);
                    if (!detectionRef.current.personPresent) {
                        console.log("[MediaPipe] GOOD POSE! Starting countdown.");
                        detectionRef.current.personPresent = true;
                        setIsPersonDetected(true);
                        startCountdown();
                    }
                } else {
                    // Invalid Pose
                    setFeedbackMessage(feedback);
                    setCountdown(null);
                    resetCaptureTimer(); // Pause/Stop timer if they move out of position
                    detectionRef.current.personPresent = false; // Soft reset
                    setIsPersonDetected(true); // Still detected, just wrong
                }

                detectionRef.current.lastDetectionTime = detectionTime;
            } else {
                // LOST
                if (detectionTime - detectionRef.current.lastDetectionTime > DEBOUNCE_MS) {
                    setFeedbackMessage(null);
                    if (detectionRef.current.personPresent || isPersonDetected) {
                        console.log("[MediaPipe] Person LOST.");
                        resetCaptureState(false);
                    }
                }
            }
        } catch (e) {
            console.error("[MediaPipe] Loop Error:", e);
        }

        requestAnimationFrame(predictLoop);
    };

    // 4. Countdown Logic
    const startCountdown = () => {
        if (detectionRef.current.timerId) return;

        let count = CAPTURE_DELAY_SECONDS;
        setCountdown(count);

        detectionRef.current.timerId = setInterval(() => {
            count--;
            setCountdown(count);

            if (count === 0) {
                capturePhoto();
                shouldDetectRef.current = false; // Stop loop after capture
                resetCaptureTimer();
            }
        }, 1000);
    };

    const resetCaptureTimer = () => {
        if (detectionRef.current.timerId) {
            clearInterval(detectionRef.current.timerId);
            detectionRef.current.timerId = null;
        }
    }

    const resetCaptureState = (fullyReset = true) => {
        resetCaptureTimer();
        if (fullyReset) {
            setCountdown(null);
            setIsPersonDetected(false);
            setFeedbackMessage(null);
            detectionRef.current.personPresent = false;
        } else {
            // Soft reset (lost person)
            setIsPersonDetected(false);
            setCountdown(null);
            setFeedbackMessage(null);
            detectionRef.current.personPresent = false;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            // Mirror flip
            ctx?.translate(canvas.width, 0);
            ctx?.scale(-1, 1);

            ctx?.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            console.log("📸 Snap!");

            if (onCapture) onCapture(dataUrl);
            if (onClose) onClose(); // Close modal or proceed
        }
    };

    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isIOSDevice);

        if (!isIOSDevice) {
            startCamera('user');
        }

        return () => {
            shouldDetectRef.current = false; // Stop loop
            resetCaptureTimer();
            if (videoRef.current?.srcObject) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        }
    }, [startCamera]);

    useEffect(() => {
        if (detector && permissionStatus === 'granted') {
            startDetectionLoop();
        }
    }, [detector, permissionStatus, startDetectionLoop]);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl">
            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* iOS Permission Trigger */}
            {isIOS && permissionStatus === 'idle' && (
                <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <CameraIcon size={64} className="text-white mb-4 animate-bounce" />
                    <h2 className="text-3xl text-white font-bold">¡Hola! 👋</h2>
                    <p className="text-gray-400 max-w-md">
                        Para probarte ropa virtual, necesitamos acceso a tu cámara.
                    </p>
                    <button
                        onClick={() => startCamera('user')}
                        className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg shadow-xl active:scale-95 transition-transform"
                    >
                        Habilitar Cámara 📸
                    </button>
                </div>
            )}

            {/* Bounding Box / Countdown Overlay */}
            <CountdownOverlay count={countdown} total={CAPTURE_DELAY_SECONDS} />
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto object-cover transform -translate-x-1/2 -translate-y-1/2 ${facingMode === 'user' ? '-scale-x-100' : ''} ${permissionStatus === 'granted' ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* OVERLAYS */}
            {isPersonDetected && (
                <div className="absolute inset-x-0 bottom-32 flex flex-col items-center justify-center pointer-events-none z-20">
                    <div className="bg-black/50 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 shadow-2xl animate-pulse">
                        <span className="text-white text-xl md:text-2xl font-light tracking-[0.3em] uppercase drop-shadow-md text-center">
                            {feedbackMessage || "Analizando tu outfit..."}
                        </span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="absolute top-4 right-4 z-30 flex gap-2">
                <button
                    onClick={switchCamera}
                    className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                    <RefreshCcw size={20} className={facingMode === 'user' ? "" : "rotate-180 transition-transform"} />
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white hover:bg-white/30 transition-colors font-bold"
                    >
                        X
                    </button>
                )}
            </div>
            {
                permissionStatus !== 'granted' && permissionStatus !== 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-30" style={{ width: '100%', height: '100%' }}>
                        <div className="text-center p-8">
                            <Lock size={48} className="text-red-500 mx-auto mb-4" />
                            <p className="text-xl text-zinc-400">{error || "Access Denied"}</p>
                            <button onClick={() => startCamera(facingMode)} className="mt-6 bg-white text-black px-6 py-3 rounded-full font-bold">Retry</button>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
