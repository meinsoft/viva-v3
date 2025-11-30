/**
 * Topics Progress Component
 * Shows learned topics and progress
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, BookMarked, Trophy } from 'lucide-react';

function TopicsProgress({ topics = [], currentTopic }) {
  if (topics.length === 0 && !currentTopic) {
    return null;
  }

  return (
    <motion.div
      className="topics-progress"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="topics-header">
        <Trophy size={18} />
        <span>Your Progress</span>
      </div>

      <div className="topics-list">
        {topics.map((topic, index) => (
          <motion.div
            key={topic}
            className="topic-item completed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CheckCircle size={16} />
            <span>{topic}</span>
          </motion.div>
        ))}

        {currentTopic && !topics.includes(currentTopic) && (
          <motion.div
            className="topic-item current"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <BookMarked size={16} />
            <span>{currentTopic}</span>
            <span className="topic-badge">In Progress</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default TopicsProgress;
