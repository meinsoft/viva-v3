/**
 * Quick Commands Component
 * Shows available voice commands based on current mode
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  PlayCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  Repeat,
  Lightbulb,
  HelpCircle,
  Volume1,
  Volume2
} from 'lucide-react';

const commandsByMode = {
  idle: [
    { icon: PlayCircle, label: 'Teach me about...', example: '"Teach me about physics"' },
    { icon: HelpCircle, label: 'Quiz me', example: '"Test my knowledge"' },
    { icon: Lightbulb, label: 'Ask anything', example: '"What is gravity?"' }
  ],
  learning: [
    { icon: SkipForward, label: 'Continue', example: '"Next" or "Continue"' },
    { icon: SkipBack, label: 'Go back', example: '"Previous section"' },
    { icon: Lightbulb, label: 'Example', example: '"Give me an example"' },
    { icon: HelpCircle, label: 'Simplify', example: '"Make it easier"' },
    { icon: StopCircle, label: 'Stop', example: '"Stop" or "Pause"' }
  ],
  quiz: [
    { icon: Repeat, label: 'Answer', example: 'Say your answer' },
    { icon: StopCircle, label: 'Stop quiz', example: '"Stop" or "That\'s enough"' }
  ],
  qa: [
    { icon: Lightbulb, label: 'Ask more', example: 'Ask another question' },
    { icon: PlayCircle, label: 'Learn', example: '"Teach me about this"' }
  ]
};

const navigationCommands = [
  { icon: Repeat, label: 'Repeat', example: '"Say that again"' },
  { icon: Volume1, label: 'Slower', example: '"Speak slower"' },
  { icon: Volume2, label: 'Faster', example: '"Speed up"' }
];

function QuickCommands({ mode = 'idle', isExpanded = true }) {
  const commands = commandsByMode[mode] || commandsByMode.idle;

  return (
    <motion.div
      className="quick-commands"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="commands-header">
        <span>Voice Commands</span>
      </div>

      <div className="commands-grid">
        {commands.map((cmd, index) => (
          <motion.div
            key={cmd.label}
            className="command-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
          >
            <cmd.icon size={18} />
            <div className="command-text">
              <span className="command-label">{cmd.label}</span>
              <span className="command-example">{cmd.example}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {isExpanded && mode !== 'idle' && (
        <>
          <div className="commands-divider" />
          <div className="commands-header">
            <span>Navigation</span>
          </div>
          <div className="commands-grid navigation">
            {navigationCommands.map((cmd, index) => (
              <motion.div
                key={cmd.label}
                className="command-item small"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + 0.1 * index }}
              >
                <cmd.icon size={14} />
                <span className="command-label">{cmd.label}</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

export default QuickCommands;
