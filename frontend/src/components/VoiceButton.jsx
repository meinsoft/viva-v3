/**
 * Voice Button Component
 * Main interaction button for voice recording
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

function VoiceButton({
  isRecording,
  isProcessing,
  isPlaying,
  onStart,
  onStop,
  disabled,
  duration
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonState = () => {
    if (isProcessing) return 'processing';
    if (isRecording) return 'recording';
    if (isPlaying) return 'playing';
    return 'idle';
  };

  const state = getButtonState();

  return (
    <div className="voice-button-container">
      {/* Ripple effects when recording */}
      {isRecording && (
        <>
          <motion.div
            className="voice-ripple"
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
          <motion.div
            className="voice-ripple"
            animate={{
              scale: [1, 2.5],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5
            }}
          />
        </>
      )}

      {/* Main button */}
      <motion.button
        className={`voice-button ${state}`}
        onClick={isRecording ? onStop : onStart}
        disabled={disabled || isProcessing || isPlaying}
        whileHover={!disabled && !isProcessing ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isProcessing ? { scale: 0.95 } : {}}
        animate={
          isRecording
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0.4)',
                  '0 0 0 20px rgba(239, 68, 68, 0)',
                  '0 0 0 0 rgba(239, 68, 68, 0)'
                ]
              }
            : {}
        }
        transition={isRecording ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={32} />
          </motion.div>
        ) : isRecording ? (
          <Square size={32} fill="currentColor" />
        ) : (
          <Mic size={32} />
        )}
      </motion.button>

      {/* Status text */}
      <motion.div
        className="voice-status"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={state}
      >
        {isProcessing ? (
          <span className="status-processing">Processing your voice...</span>
        ) : isRecording ? (
          <span className="status-recording">
            Recording... {formatDuration(duration)}
          </span>
        ) : isPlaying ? (
          <span className="status-playing">Playing response...</span>
        ) : (
          <span className="status-idle">Tap to speak</span>
        )}
      </motion.div>

      {/* Instructions */}
      {!isRecording && !isProcessing && !isPlaying && (
        <motion.p
          className="voice-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Try saying: "Teach me about solar system" or "Quiz me"
        </motion.p>
      )}
    </div>
  );
}

export default VoiceButton;
