/**
 * Viva - Main Application Component
 * Voice-controlled educational platform with multi-language support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  RefreshCw,
  MicOff,
  AlertCircle
} from 'lucide-react';

// Components
import PermissionModal from './components/PermissionModal';
import VoiceButton from './components/VoiceButton';
import ModeIndicator from './components/ModeIndicator';
import ConversationBubble from './components/ConversationBubble';
import TopicsProgress from './components/TopicsProgress';
import QuickCommands from './components/QuickCommands';
import LanguageSelector from './components/LanguageSelector';

// Hooks
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import { useAudioPlayer } from './hooks/useAudioPlayer';

// Services
import api from './services/api';

// Styles
import './styles/index.css';

// UI Text translations
const UI_TEXT = {
  en: {
    welcome: 'Welcome to Viva',
    tapToSpeak: 'Tap the microphone and start speaking to begin learning',
    connected: 'Connected',
    offline: 'Offline',
    resetSession: 'Reset Session',
    micRequired: 'Microphone Access Required',
    micRequiredDesc: 'Viva needs microphone access to work. Please enable it in your browser settings.',
    refreshPage: 'Refresh Page',
    processingError: 'Failed to process voice. Please try again.',
    resetError: 'Failed to reset session.',
    dismiss: 'Dismiss'
  },
  az: {
    welcome: 'Viva-ya xoş gəlmisiniz',
    tapToSpeak: 'Öyrənməyə başlamaq üçün mikrofona toxunun və danışın',
    connected: 'Bağlı',
    offline: 'Oflayn',
    resetSession: 'Sıfırla',
    micRequired: 'Mikrofon İcazəsi Lazımdır',
    micRequiredDesc: 'Viva işləmək üçün mikrofon icazəsinə ehtiyac duyur. Brauzer parametrlərinizdə aktiv edin.',
    refreshPage: 'Səhifəni Yenilə',
    processingError: 'Səs emal edilə bilmədi. Yenidən cəhd edin.',
    resetError: 'Sessiya sıfırlana bilmədi.',
    dismiss: 'Bağla'
  }
};

function App() {
  // State
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [language, setLanguage] = useState(api.getLanguage());

  // Session state
  const [session, setSession] = useState({
    mode: 'idle',
    currentTopic: null,
    topicsLearned: [],
    quizScore: 0,
    quizTotal: 0
  });

  // Conversation history
  const [messages, setMessages] = useState([]);
  const [currentAudioBlob, setCurrentAudioBlob] = useState(null);

  // Refs
  const conversationEndRef = useRef(null);

  // Get UI text for current language
  const t = UI_TEXT[language] || UI_TEXT.en;

  // Hooks
  const {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    clearAudio,
    isGranted,
    permissionStatus,
    requestPermission
  } = useVoiceRecorder();

  const {
    isPlaying,
    playAudio,
    stop: stopAudio
  } = useAudioPlayer();

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.healthCheck();
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+V: Start/Stop voice recording
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();

        if (isRecording) {
          handleStopRecording();
        } else if (!isProcessing && isGranted && isConnected) {
          if (isPlaying) {
            stopAudio();
          }
          startRecording();
        } else if (!isGranted) {
          setShowPermissionModal(true);
        }
      }

      // Ctrl+R: Reset session
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        handleResetSession();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isProcessing, isGranted, isConnected, isPlaying]);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      const sessionData = await api.getSession();
      if (sessionData) {
        setSession({
          mode: sessionData.mode,
          currentTopic: sessionData.current_topic,
          topicsLearned: sessionData.topics_learned,
          quizScore: sessionData.quiz_score,
          quizTotal: sessionData.quiz_total
        });
        // Sync language from session
        if (sessionData.language) {
          setLanguage(sessionData.language);
        }
      }
    };

    loadSession();
  }, []);

  // Check permission status on mount
  useEffect(() => {
    if (permissionStatus === 'prompt') {
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [permissionStatus]);

  // Process audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording) {
      processVoiceInput(audioBlob);
    }
  }, [audioBlob, isRecording]);

  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle language change
  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);
    await api.changeLanguage(newLanguage);
  };

  // Handle permission request
  const handleRequestPermission = async () => {
    setPermissionLoading(true);
    const granted = await requestPermission();
    setPermissionLoading(false);

    if (granted) {
      setShowPermissionModal(false);
    }
  };

  // Handle permission denial
  const handleDenyPermission = () => {
    setShowPermissionModal(false);
  };

  // Process voice input
  const processVoiceInput = async (blob) => {
    setIsProcessing(true);
    setError(null);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: language === 'az' ? 'Emal edilir...' : 'Processing...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await api.processVoice(blob);

      // Update user message with transcription
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, text: result.transcribed || (language === 'az' ? 'Səs mesajı' : 'Voice message') }
            : msg
        )
      );

      // Add assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: result.response,
        timestamp: new Date(),
        hasAudio: true
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update session state
      setSession(prev => ({
        ...prev,
        mode: result.mode
      }));

      // Refresh full session data
      const sessionData = await api.getSession();
      if (sessionData) {
        setSession({
          mode: sessionData.mode,
          currentTopic: sessionData.current_topic,
          topicsLearned: sessionData.topics_learned,
          quizScore: sessionData.quiz_score,
          quizTotal: sessionData.quiz_total
        });
      }

      // Store audio and play it
      setCurrentAudioBlob(result.audio);
      playAudio(result.audio);

    } catch (err) {
      console.error('Processing error:', err);
      setError(t.processingError);
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsProcessing(false);
      clearAudio();
    }
  };

  // Handle voice button click
  const handleVoiceButtonClick = () => {
    if (!isGranted) {
      setShowPermissionModal(true);
      return;
    }

    if (isPlaying) {
      stopAudio();
    }

    startRecording();
  };

  // Handle stop recording
  const handleStopRecording = () => {
    stopRecording();
  };

  // Handle replay audio
  const handleReplayAudio = () => {
    if (currentAudioBlob) {
      playAudio(currentAudioBlob);
    }
  };

  // Handle reset session
  const handleResetSession = async () => {
    try {
      await api.resetSession();
      setSession({
        mode: 'idle',
        currentTopic: null,
        topicsLearned: [],
        quizScore: 0,
        quizTotal: 0
      });
      setMessages([]);
      setCurrentAudioBlob(null);
    } catch (err) {
      setError(t.resetError);
    }
  };

  // Render permission denied state
  if (permissionStatus === 'denied') {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <Volume2 size={24} />
              </div>
              <span>Viva</span>
            </div>
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </header>

        <main className="main-content">
          <div className="permission-denied">
            <div className="permission-denied-icon">
              <MicOff size={40} />
            </div>
            <h2>{t.micRequired}</h2>
            <p>{t.micRequiredDesc}</p>
            <ol>
              <li>{language === 'az' ? 'Ünvan çubuğundakı kilid/məlumat ikonuna klikləyin' : 'Click the lock/info icon in the address bar'}</li>
              <li>{language === 'az' ? 'İcazələrdə "Mikrofon"u tapın' : 'Find "Microphone" in permissions'}</li>
              <li>{language === 'az' ? '"İcazə ver" olaraq dəyişdirin' : 'Change it to "Allow"'}</li>
              <li>{language === 'az' ? 'Səhifəni yeniləyin' : 'Refresh the page'}</li>
            </ol>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} />
              {t.refreshPage}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal && !isGranted}
        onRequestPermission={handleRequestPermission}
        onDeny={handleDenyPermission}
        isLoading={permissionLoading}
      />

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <Volume2 size={24} />
            </div>
            <span>Viva</span>
          </div>

          <div className="header-actions">
            {/* Language Selector */}
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
              disabled={isProcessing || isRecording}
            />

            {/* Connection status */}
            <div className="connection-status">
              <span
                className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}
              />
              {isConnected ? t.connected : t.offline}
            </div>

            {/* Mode indicator */}
            <ModeIndicator
              mode={session.mode}
              topic={session.currentTopic}
              score={session.quizScore}
              total={session.quizTotal}
            />

            {/* Reset button */}
            <button
              className="btn btn-icon btn-secondary"
              onClick={handleResetSession}
              title={t.resetSession}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Topics Progress */}
        <TopicsProgress
          topics={session.topicsLearned}
          currentTopic={session.currentTopic}
        />

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle size={20} />
              {error}
              <button
                className="btn btn-text btn-small"
                onClick={() => setError(null)}
              >
                {t.dismiss}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation */}
        <div className="conversation-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <Volume2 size={64} className="empty-state-icon" />
              <h3>{t.welcome}</h3>
              <p>{t.tapToSpeak}</p>
            </div>
          ) : (
            messages.map((message) => (
              <ConversationBubble
                key={message.id}
                type={message.type}
                text={message.text}
                timestamp={message.timestamp}
                isPlaying={isPlaying && message.type === 'assistant'}
                hasAudio={message.hasAudio}
                onPlayAudio={handleReplayAudio}
              />
            ))
          )}
          <div ref={conversationEndRef} />
        </div>

        {/* Voice Button */}
        <VoiceButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          isPlaying={isPlaying}
          onStart={handleVoiceButtonClick}
          onStop={handleStopRecording}
          disabled={!isConnected}
          duration={duration}
          language={language}
        />

        {/* Quick Commands */}
        <QuickCommands mode={session.mode} language={language} />
      </main>
    </div>
  );
}

export default App;
