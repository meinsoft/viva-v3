/**
 * Permission Modal Component
 * One-time microphone permission request
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Shield, Volume2 } from 'lucide-react';

function PermissionModal({ isOpen, onRequestPermission, onDeny, isLoading }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="permission-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="permission-modal"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="permission-icon-wrapper">
            <motion.div
              className="permission-icon"
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 0 0 rgba(99, 102, 241, 0.4)',
                  '0 0 0 20px rgba(99, 102, 241, 0)',
                  '0 0 0 0 rgba(99, 102, 241, 0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Mic size={48} />
            </motion.div>
          </div>

          <h2>Enable Microphone Access</h2>

          <p className="permission-description">
            EduVoice needs access to your microphone to provide voice-controlled learning.
            This permission will be saved so you won't be asked again.
          </p>

          <div className="permission-features">
            <div className="feature-item">
              <Volume2 size={20} />
              <span>Voice-controlled learning</span>
            </div>
            <div className="feature-item">
              <Shield size={20} />
              <span>Your privacy is protected</span>
            </div>
          </div>

          <div className="permission-buttons">
            <motion.button
              className="btn btn-primary btn-large"
              onClick={onRequestPermission}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  <Mic size={20} />
                  Allow Microphone
                </>
              )}
            </motion.button>

            <button
              className="btn btn-text"
              onClick={onDeny}
              disabled={isLoading}
            >
              Maybe Later
            </button>
          </div>

          <p className="permission-note">
            You can change this setting anytime in your browser settings.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PermissionModal;
