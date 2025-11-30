/**
 * Mode Indicator Component
 * Shows current session mode (Learning, Quiz, Q&A)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Brain, MessageCircle, Home } from 'lucide-react';

const modeConfig = {
  idle: {
    icon: Home,
    label: 'Ready',
    color: 'var(--text-secondary)',
    bg: 'var(--surface-elevated)'
  },
  learning: {
    icon: BookOpen,
    label: 'Learning Mode',
    color: 'var(--success)',
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  quiz: {
    icon: Brain,
    label: 'Quiz Mode',
    color: 'var(--warning)',
    bg: 'rgba(245, 158, 11, 0.1)'
  },
  qa: {
    icon: MessageCircle,
    label: 'Q&A Mode',
    color: 'var(--primary)',
    bg: 'rgba(99, 102, 241, 0.1)'
  }
};

function ModeIndicator({ mode = 'idle', topic, score, total }) {
  const config = modeConfig[mode] || modeConfig.idle;
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        className="mode-indicator"
        style={{
          backgroundColor: config.bg,
          borderColor: config.color
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Icon size={18} color={config.color} />

        <div className="mode-info">
          <span className="mode-label" style={{ color: config.color }}>
            {config.label}
          </span>

          {topic && mode === 'learning' && (
            <span className="mode-topic">{topic}</span>
          )}

          {mode === 'quiz' && total > 0 && (
            <span className="mode-score">
              Score: {score}/{total}
            </span>
          )}
        </div>

        {/* Animated dot for active modes */}
        {mode !== 'idle' && (
          <motion.span
            className="mode-active-dot"
            style={{ backgroundColor: config.color }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default ModeIndicator;
