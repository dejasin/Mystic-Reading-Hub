import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReadingType = "Full Reading" | "Deep Dive" | "Synastry" | "Profile Reading";

export interface JournalEntry {
  id: string;
  date: number;
  readingType: ReadingType;
  title: string;
  preview: string;
  fullText: string;
  favorite: boolean;
  metadata?: {
    profileNames?: string[];
    category?: string;
    profileId?: string;
  };
}

interface JournalContextValue {
  entries: JournalEntry[];
  isLoaded: boolean;
  addEntry: (entry: Omit<JournalEntry, "id" | "date" | "favorite">) => Promise<JournalEntry>;
  toggleFavorite: (id: string) => Promise<void>;
  getEntry: (id: string) => JournalEntry | undefined;
  deleteEntry: (id: string) => Promise<void>;
}

const STORAGE_KEY = "oracle_journal_v1";

const JournalContext = createContext<JournalContextValue | null>(null);

function generatePreview(text: string, maxLength = 120): string {
  const cleaned = text
    .replace(/✦\s*[^\n]+/g, "")
    .replace(/─── ✦ ───/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  const firstParagraph = cleaned.split("\n").find(l => l.trim().length > 20) ?? cleaned;
  if (firstParagraph.length <= maxLength) return firstParagraph.trim();
  return firstParagraph.slice(0, maxLength).trim() + "…";
}

async function persistToStorage(data: JournalEntry[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save journal:", e);
  }
}

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw === null) {
          // No entries — leave state as empty array (already initialized to [])
        } else {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setEntries(parsed);
          } catch {
            console.error("Failed to parse journal entries");
          }
        }
      })
      .catch(e => console.error("Failed to read journal from storage:", e))
      .finally(() => setIsLoaded(true));
  }, []);

  const addEntry = useCallback(async (entry: Omit<JournalEntry, "id" | "date" | "favorite">) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `journal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: Date.now(),
      favorite: false,
      preview: entry.preview || generatePreview(entry.fullText),
    };
    let next: JournalEntry[] = [];
    setEntries(prev => {
      next = [newEntry, ...prev];
      return next;
    });
    await persistToStorage(next);
    return newEntry;
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    let next: JournalEntry[] = [];
    setEntries(prev => {
      next = prev.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e);
      return next;
    });
    await persistToStorage(next);
  }, []);

  const getEntry = useCallback((id: string) => entriesRef.current.find(e => e.id === id), []);

  const deleteEntry = useCallback(async (id: string) => {
    let next: JournalEntry[] = [];
    setEntries(prev => {
      next = prev.filter(e => e.id !== id);
      return next;
    });
    await persistToStorage(next);
  }, []);

  return (
    <JournalContext.Provider value={{ entries, isLoaded, addEntry, toggleFavorite, getEntry, deleteEntry }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used inside JournalProvider");
  return ctx;
}
