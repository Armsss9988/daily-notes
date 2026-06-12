import { useState, useEffect, useCallback, useRef } from 'react';

const api = window.api;

export function useNotes() {
  const [data, setData] = useState({ daily_notes: {}, notes: [] });
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    api.loadData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const save = useCallback((newData) => {
    setData(newData);
    api.saveData(newData);
  }, []);

  const saveLater = useCallback((newData) => {
    setData(newData);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.saveData(newData);
    }, 2000);
  }, []);

  const dailyNote = useCallback((date) => {
    return data.daily_notes?.[date] || null;
  }, [data]);

  const setDailyNote = useCallback((date, note) => {
    const nd = { ...data };
    if (note && note.c?.text?.trim()) {
      nd.daily_notes = { ...nd.daily_notes, [date]: note };
    } else {
      if (nd.daily_notes?.[date]) {
        nd.daily_notes = { ...nd.daily_notes };
        delete nd.daily_notes[date];
      }
    }
    saveLater(nd);
  }, [data, saveLater]);

  const notes = useCallback(() => {
    return data.notes || [];
  }, [data]);

  const addNote = useCallback((note) => {
    const nd = { ...data, notes: [...(data.notes || []), note] };
    save(nd);
  }, [data, save]);

  const updateNote = useCallback((id, updates) => {
    const nd = { ...data, notes: (data.notes || []).map(n =>
      n.id === id ? { ...n, ...updates } : n
    ) };
    save(nd);
  }, [data, save]);

  const deleteNote = useCallback((id) => {
    const note = (data.notes || []).find(n => n.id === id);
    if (!note) return;
    const nd = { ...data, notes: (data.notes || []).filter(n => n.id !== id) };
    nd.deleted_notes = [...(nd.deleted_notes || []), { note, deletedAt: new Date().toISOString() }];
    save(nd);
  }, [data, save]);

  const deletedNotes = useCallback(() => {
    return data.deleted_notes || [];
  }, [data]);

  const restoreNote = useCallback((id) => {
    const entry = (data.deleted_notes || []).find(e => e.note.id === id);
    if (!entry) return;
    const nd = { ...data, notes: [...(data.notes || []), entry.note] };
    nd.deleted_notes = (nd.deleted_notes || []).filter(e => e.note.id !== id);
    save(nd);
  }, [data, save]);

  const saveNow = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    api.saveData(data);
  }, [data]);

  return { data, loading, dailyNote, setDailyNote, notes, addNote, updateNote, deleteNote, deletedNotes, restoreNote, saveNow };
}
