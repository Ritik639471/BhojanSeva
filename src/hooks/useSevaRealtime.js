import { useEffect } from 'react';
import { supabase, isMockBackend } from '../lib/supabase';

/**
 * Custom hook to subscribe to Supabase Realtime for the `sevas` table.
 * Calls `onInsert` when a new seva is created, `onUpdate` when one changes.
 * Automatically cleans up the subscription on unmount.
 */
export default function useSevaRealtime({ onInsert, onUpdate }) {
  useEffect(() => {
    if (isMockBackend) return; // Skip in mock/local mode

    const channel = supabase
      .channel('sevas-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sevas' },
        (payload) => {
          if (onInsert) onInsert(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sevas' },
        (payload) => {
          if (onUpdate) onUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onInsert, onUpdate]);
}
