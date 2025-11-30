/**
 * Waveform Visualizer Component
 * Animated audio waveform display
 */

import React from 'react';
import { motion } from 'framer-motion';

function WaveformVisualizer({ isActive, barCount = 5, color = 'var(--primary)' }) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className="waveform-visualizer">
      {bars.map((_, index) => (
        <motion.div
          key={index}
          className="waveform-bar"
          style={{ backgroundColor: color }}
          animate={
            isActive
              ? {
                  height: ['20%', '80%', '40%', '90%', '30%', '70%', '20%'],
                  transition: {
                    duration: 0.8,
                    repeat: Infinity,
                    delay: index * 0.1,
                    ease: 'easeInOut'
                  }
                }
              : {
                  height: '20%'
                }
          }
        />
      ))}
    </div>
  );
}

export default WaveformVisualizer;
