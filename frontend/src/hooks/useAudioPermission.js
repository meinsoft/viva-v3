/**
 * Custom hook for managing audio permissions
 * Handles persistent microphone access
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const PERMISSION_KEY = 'eduvoice_mic_permission';

export function useAudioPermission() {
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [isChecking, setIsChecking] = useState(true);
  const streamRef = useRef(null);

  // Check stored permission and actual browser permission
  const checkPermission = useCallback(async () => {
    setIsChecking(true);

    try {
      // Check if browser supports permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' });
        setPermissionStatus(result.state);

        // Listen for permission changes
        result.onchange = () => {
          setPermissionStatus(result.state);
          if (result.state === 'granted') {
            localStorage.setItem(PERMISSION_KEY, 'granted');
          } else if (result.state === 'denied') {
            localStorage.setItem(PERMISSION_KEY, 'denied');
          }
        };
      } else {
        // Fallback: check localStorage
        const stored = localStorage.getItem(PERMISSION_KEY);
        if (stored === 'granted') {
          // Try to actually get the stream to verify
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setPermissionStatus('granted');
          } catch {
            setPermissionStatus('prompt');
            localStorage.removeItem(PERMISSION_KEY);
          }
        } else if (stored === 'denied') {
          setPermissionStatus('denied');
        } else {
          setPermissionStatus('prompt');
        }
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setPermissionStatus('prompt');
    }

    setIsChecking(false);
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Keep stream reference for later use
      streamRef.current = stream;

      // Permission granted
      setPermissionStatus('granted');
      localStorage.setItem(PERMISSION_KEY, 'granted');

      return true;
    } catch (error) {
      console.error('Permission request error:', error);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        localStorage.setItem(PERMISSION_KEY, 'denied');
      }

      return false;
    }
  }, []);

  // Get active stream or create new one
  const getStream = useCallback(async () => {
    if (streamRef.current && streamRef.current.active) {
      return streamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      setPermissionStatus('granted');
      localStorage.setItem(PERMISSION_KEY, 'granted');

      return stream;
    } catch (error) {
      console.error('Failed to get stream:', error);
      throw error;
    }
  }, []);

  // Stop all tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermission();

    // Cleanup on unmount
    return () => {
      stopStream();
    };
  }, [checkPermission, stopStream]);

  return {
    permissionStatus,
    isChecking,
    requestPermission,
    getStream,
    stopStream,
    isGranted: permissionStatus === 'granted',
    isDenied: permissionStatus === 'denied',
    needsPermission: permissionStatus === 'prompt'
  };
}

export default useAudioPermission;
