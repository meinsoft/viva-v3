/**
 * Viva API Service
 * Handles all communication with the backend
 */

const API_BASE_URL = 'http://localhost:8000';

class VivaAPI {
  constructor() {
    this.sessionId = localStorage.getItem('viva_session_id') || null;
    this.language = localStorage.getItem('viva_language') || 'en';
  }

  /**
   * Save session ID to localStorage
   */
  saveSession(sessionId) {
    this.sessionId = sessionId;
    localStorage.setItem('viva_session_id', sessionId);
  }

  /**
   * Set and save language preference
   */
  setLanguage(language) {
    this.language = language;
    localStorage.setItem('viva_language', language);
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.language;
  }

  /**
   * Process voice input and get audio response
   */
  async processVoice(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', this.language);

    if (this.sessionId) {
      formData.append('session_id', this.sessionId);
    }

    const response = await fetch(`${API_BASE_URL}/process-voice`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Extract headers
    const sessionId = response.headers.get('X-Session-ID');
    const transcribed = decodeURIComponent(response.headers.get('X-Transcribed-Text') || '');
    const responseText = decodeURIComponent(response.headers.get('X-Response-Text') || '');
    const mode = response.headers.get('X-Mode') || 'idle';
    const language = response.headers.get('X-Language') || this.language;

    // Save session
    if (sessionId) {
      this.saveSession(sessionId);
    }

    // Get audio blob
    const audioResponseBlob = await response.blob();

    return {
      audio: audioResponseBlob,
      transcribed,
      response: responseText,
      mode,
      sessionId,
      language
    };
  }

  /**
   * Process text input (for testing/fallback)
   */
  async processText(text, returnAudio = false) {
    const response = await fetch(`${API_BASE_URL}/process-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        session_id: this.sessionId,
        return_audio: returnAudio,
        language: this.language
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.session_id) {
      this.saveSession(data.session_id);
    }

    return data;
  }

  /**
   * Get current session state
   */
  async getSession() {
    if (!this.sessionId) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/session/${this.sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          localStorage.removeItem('viva_session_id');
          this.sessionId = null;
          return null;
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Sync language from session
      if (data.language) {
        this.setLanguage(data.language);
      }

      return data;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Reset current session
   */
  async resetSession() {
    const response = await fetch(`${API_BASE_URL}/session/reset?language=${this.language}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    this.saveSession(data.session_id);
    return data;
  }

  /**
   * Change session language
   */
  async changeLanguage(language) {
    this.setLanguage(language);

    if (this.sessionId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/set-language?session_id=${this.sessionId}&language=${language}`,
          { method: 'POST' }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    }

    return { language };
  }

  /**
   * Test audio endpoint
   */
  async testAudio() {
    const response = await fetch(`${API_BASE_URL}/test-audio?language=${this.language}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.blob();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  }
}

export const api = new VivaAPI();
export default api;
