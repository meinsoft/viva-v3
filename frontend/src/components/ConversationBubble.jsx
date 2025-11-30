/**
 * Conversation Bubble Component
 * Displays messages in the conversation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Volume2, VolumeX } from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';

function ConversationBubble({
  type, // 'user' or 'assistant'
  text,
  isPlaying,
  onPlayAudio,
  hasAudio,
  timestamp
}) {
  const isUser = type === 'user';

  return (
    <motion.div
      className={`conversation-bubble ${isUser ? 'user' : 'assistant'}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="bubble-avatar">
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      <div className="bubble-content">
        <div className="bubble-header">
          <span className="bubble-sender">{isUser ? 'You' : 'EduVoice'}</span>
          {timestamp && (
            <span className="bubble-time">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>

        <div className="bubble-text">
          {text || (
            <span className="text-muted">
              {isUser ? 'Voice message' : 'Processing...'}
            </span>
          )}
        </div>

        {/* Audio controls for assistant messages */}
        {!isUser && hasAudio && (
          <div className="bubble-audio">
            {isPlaying ? (
              <div className="audio-playing">
                <WaveformVisualizer isActive={true} barCount={4} />
                <span>Playing...</span>
              </div>
            ) : (
              <button
                className="btn btn-icon btn-small"
                onClick={onPlayAudio}
                title="Play audio"
              >
                <Volume2 size={16} />
                <span>Play</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ConversationBubble;
