import { useState, useCallback } from 'react';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  remainingTime: number;
}

interface FileUploadProgress {
  [fileId: string]: UploadProgress;
}

export const useUploadProgress = () => {
  const [progress, setProgress] = useState<FileUploadProgress>({});
  const [startTimes, setStartTimes] = useState<{ [fileId: string]: number }>({});

  const initializeProgress = useCallback((fileId: string, total: number) => {
    setProgress((prev) => ({
      ...prev,
      [fileId]: {
        loaded: 0,
        total,
        percentage: 0,
        speed: 0,
        remainingTime: 0,
      },
    }));
    setStartTimes((prev) => ({
      ...prev,
      [fileId]: Date.now(),
    }));
  }, []);

  const updateProgress = useCallback((fileId: string, loaded: number) => {
    setProgress((prev) => {
      const fileProgress = prev[fileId];
      if (!fileProgress) return prev;

      const startTime = startTimes[fileId];
      const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
      const speed = loaded / elapsedTime; // bytes per second
      const remainingBytes = fileProgress.total - loaded;
      const remainingTime = remainingBytes / speed;
      const percentage = Math.round((loaded * 100) / fileProgress.total);

      return {
        ...prev,
        [fileId]: {
          loaded,
          total: fileProgress.total,
          percentage,
          speed,
          remainingTime,
        },
      };
    });
  }, [startTimes]);

  const completeProgress = useCallback((fileId: string) => {
    setProgress((prev) => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
    setStartTimes((prev) => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({});
    setStartTimes({});
  }, []);

  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const exponent = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(1024)), units.length - 1);
    const value = (bytesPerSecond / Math.pow(1024, exponent)).toFixed(2);
    return `${value} ${units[exponent]}`;
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds === 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const getFormattedProgress = useCallback(
    (fileId: string) => {
      const fileProgress = progress[fileId];
      if (!fileProgress) return null;

      return {
        ...fileProgress,
        formattedSpeed: formatSpeed(fileProgress.speed),
        formattedTime: formatTime(fileProgress.remainingTime),
      };
    },
    [progress, formatSpeed, formatTime]
  );

  return {
    progress,
    initializeProgress,
    updateProgress,
    completeProgress,
    resetProgress,
    getFormattedProgress,
  };
}; 