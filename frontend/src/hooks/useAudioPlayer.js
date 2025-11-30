/**
 * Custom hook for audio playback
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);
  const urlRef = useRef(null);

  // Cleanup URL on unmount or when changing audio
  const cleanupUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // Play audio from blob
  const playAudio = useCallback(async (audioBlob) => {
    setIsLoading(true);

    try {
      // Cleanup previous
      cleanupUrl();
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new URL and audio
      const url = URL.createObjectURL(audioBlob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      // Set up event listeners
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        console.error('Audio playback error');
      };

      // Play
      await audio.play();
      setIsPlaying(true);

    } catch (error) {
      console.error('Play audio error:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [cleanupUrl]);

  // Pause
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Resume
  const resume = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  // Stop
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  // Seek
  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupUrl();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [cleanupUrl]);

  return {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    playAudio,
    pause,
    resume,
    stop,
    seek,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0
  };
}

export default useAudioPlayer;
