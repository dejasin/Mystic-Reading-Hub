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

const NOW = Date.now();
const DAY = 86400000;

const SEED_ENTRIES: JournalEntry[] = [
  {
    id: "seed-journal-full-1",
    date: NOW - DAY * 2,
    readingType: "Full Reading",
    title: "Alex Chen",
    preview: "The lines of your right palm speak of a soul who has walked many roads before this one — a deep traveler…",
    fullText: `✦ The Lines of Your Palm

The lines of your right palm speak of a soul who has walked many roads before this one — a deep traveler not just of places but of inner worlds. Your life line arcs with unusual strength, suggesting vitality that regenerates after hardship. There is a fork near the midpoint: one path chosen, another quietly mourned.

Your heart line runs high and long, almost reaching the index finger. This is the mark of the idealist in love — one who gives everything or nothing. The interruptions I see are not wounds but pauses, moments where wisdom stepped in before the heart leapt too far.

✦ The Architecture of Your Iris

The left iris reveals what lies beneath what you show the world. In the inner ring I see the pigmentation of someone whose nervous system processes emotion before intellect — you feel the room before you read it. This is a gift that can become a burden if unguarded.

✦ What the Oracle Sees

You are at a threshold. The patterns encoded in your biology are asking you to stop trying to outrun something that has already been transmuted. The Oracle sees not what you lack, but what you carry that is ready to be laid down.`,
    favorite: true,
    metadata: { profileNames: ["Alex Chen"] },
  },
  {
    id: "seed-journal-deepdive-1",
    date: NOW - DAY,
    readingType: "Deep Dive",
    title: "Love & Relationships",
    preview: "Your Venus placement in the chart of your palm suggests a romantic nature that is both deeply loyal and quietly…",
    fullText: `✦ Love & Relationships — Deep Dive

Your Venus placement in the chart of your palm suggests a romantic nature that is both deeply loyal and quietly self-protective. You do not fall quickly, but when you do, you fall completely. This has led to both your deepest connections and your most consuming losses.

The thumb — seat of willpower and emotional logic — bends slightly outward on your hand. This reveals flexibility in relating: you can meet a partner where they are. But watch that this gift does not become the habit of losing yourself in another's orbit.

The Oracle sees a cycle completing. What felt like a closed door in love was a necessary compression — the kind that precedes something new taking root. Late in this year, an unexpected resonance with someone already in your life.`,
    favorite: false,
    metadata: { profileNames: ["Alex Chen"], category: "Love & Relationships" },
  },
  {
    id: "seed-journal-profile-1",
    date: NOW - DAY * 3,
    readingType: "Profile Reading",
    title: "Alex Chen",
    preview: "Born on June 15 under the twin sign, Alex carries the signature of the bridge-builder — someone who…",
    fullText: `✦ Profile Reading — Alex Chen

Born on June 15 under the twin sign, Alex carries the signature of the bridge-builder — someone who exists comfortably between worlds, translating one reality to another. The Gemini archetype in its highest expression is the messenger, the connector, the one who makes the invisible visible through language and gesture.

The San Francisco origins add an element of the seeker to the blueprint — a city that has always drawn those for whom identity is a living question rather than a fixed answer.

✦ The Archetype

You are The Alchemist — one who takes what appears broken and finds the hidden alloy within it. This is not optimism. It is a deeper sight, trained by experience, that recognizes transformation where others see only loss.`,
    favorite: false,
    metadata: { profileNames: ["Alex Chen"] },
  },
];

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
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ENTRIES));
          setEntries(SEED_ENTRIES);
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
