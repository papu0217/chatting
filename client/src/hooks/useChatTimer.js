import { useState, useEffect, useMemo } from 'react';
import { formatDurationHMS, formatDurationHuman, formatTime } from '../utils/formatters';

/**
 * Hook to calculate and tick session duration based on server joinedAt timestamp
 */
export function useChatTimer(joinedAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!joinedAt) return;

    // Tick every 1000ms
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [joinedAt]);

  const { elapsedSeconds, formattedHMS, formattedHuman, joinedTimeFormatted } = useMemo(() => {
    if (!joinedAt) {
      return {
        elapsedSeconds: 0,
        formattedHMS: '00:00',
        formattedHuman: '0s',
        joinedTimeFormatted: '',
      };
    }

    const start = new Date(joinedAt).getTime();
    const diffSec = Math.max(0, Math.floor((now - start) / 1000));

    return {
      elapsedSeconds: diffSec,
      formattedHMS: formatDurationHMS(diffSec),
      formattedHuman: formatDurationHuman(diffSec, true),
      joinedTimeFormatted: formatTime(joinedAt),
    };
  }, [joinedAt, now]);

  return {
    elapsedSeconds,
    formattedHMS,
    formattedHuman,
    joinedTimeFormatted,
  };
}
