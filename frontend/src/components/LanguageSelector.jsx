/**
 * Language Selector Component
 * Allows switching between English and Azerbaijani
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' }
];

function LanguageSelector({ currentLanguage, onLanguageChange, disabled }) {
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <div className="language-selector">
      <div className="language-toggle">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            className={`language-btn ${currentLanguage === lang.code ? 'active' : ''}`}
            onClick={() => onLanguageChange(lang.code)}
            disabled={disabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={lang.name}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-code">{lang.code.toUpperCase()}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSelector;
