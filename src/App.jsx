import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Settings, Zap, AlertCircle } from 'lucide-react';
import { GeminiSolver } from './utils/gemini';
import './index.css';

const SCAN_INTERVAL = 30; // seconds

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(!apiKey);
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SCAN_INTERVAL);
  const webcamRef = useRef(null);
  const timerRef = useRef(null);

  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowSettings(false);
  };

  const captureAndSolve = useCallback(async () => {
    if (!webcamRef.current || !apiKey) return;

    setIsScanning(true);
    const imageSrc = webcamRef.current.getScreenshot();

    if (imageSrc) {
      try {
        const solver = new GeminiSolver(apiKey);
        const data = await solver.solveProblem(imageSrc);
        if (data && data.found) {
          setResult(data);
        } else {
          // If not found, maybe just keep previous or show nothing/toast
          // We'll reset result to null if explicitly not found to avoid confusion?
          // Or keep showing old result until new one overrides.
          // Let's clear it if explicitly nothing found to avoid stale data
          if (data.found === false) {
            // Optional: Toast "No question detected"
          }
        }
      } catch (e) {
        console.error("Solve failed", e);
      }
    }

    setIsScanning(false);
    setTimeLeft(SCAN_INTERVAL);
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) return;

    const tick = () => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          captureAndSolve();
          return SCAN_INTERVAL;
        }
        return prev - 1;
      });
    };

    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [apiKey, captureAndSolve]);

  // Manual trigger
  const handleManualScan = () => {
    captureAndSolve();
    setTimeLeft(SCAN_INTERVAL);
  };

  const videoConstraints = {
    facingMode: "environment" // Use back camera on mobile
  };

  return (
    <div className="app-container">
      {/* Settings / Onboarding */}
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <h2>ExamMega Setup</h2>
            <p>Please enter your Gemini API Key to start.</p>
            <input
              type="password"
              placeholder="Gemini API Key"
              className="api-input"
              defaultValue={apiKey}
              onBlur={(e) => saveApiKey(e.target.value)}
            />
            <button className="primary-btn" onClick={() => setShowSettings(false)}>
              Start
            </button>
            <p className="subtext">The key is stored locally on your device.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="logo">ExamMega</div>
        <button className="icon-btn" onClick={() => setShowSettings(true)}>
          <Settings size={24} color="var(--color-text-primary)" />
        </button>
      </header>

      {/* Camera Feed */}
      <div className="camera-wrapper">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam-view"
        />
        {/* Scanning Overlay Effect */}
        {isScanning && <div className="scan-line"></div>}
      </div>

      {/* Result & Controls */}
      <div className="control-panel">

        {/* Result Display */}
        {result ? (
          <div className={`result-card ans-${result.answer?.toLowerCase()}`}>
            <div className="result-badge">{result.answer}</div>
            <div className="result-text">{result.explanation}</div>
          </div>
        ) : (
          <div className="placeholder-card">
            <Zap size={24} className="placeholder-icon" />
            <p>Point at a question to solve</p>
          </div>
        )}

        {/* Timer / Manual Trigger */}
        <div className="timer-bar" onClick={handleManualScan}>
          <div className="timer-progress" style={{ width: `${(timeLeft / SCAN_INTERVAL) * 100}%` }}></div>
          <span className="timer-text">{isScanning ? 'Scanning...' : `Auto scan in ${timeLeft}s`}</span>
          {!isScanning && <Camera size={16} className="timer-icon" />}
        </div>
      </div>
    </div>
  );
}

export default App;
