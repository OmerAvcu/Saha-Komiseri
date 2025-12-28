// Match Status Types
export type MatchStatus = 'scheduled' | 'live' | 'completed';

// Match Event Types
export type MatchEventType =
    | 'goal'
    | 'yellowCard'
    | 'redCard'
    | 'substitution'
    | 'penalty'
    | 'ownGoal'
    | 'injury'
    | 'halfTime'
    | 'fullTime';

// Match Event Interface
export interface MatchEvent {
    id: string;
    minute: number;
    type: MatchEventType;
    team: 'home' | 'away';
    player?: string;
    playerOut?: string; // for substitutions
    playerIn?: string;  // for substitutions
    notes?: string;
}

// Match Interface
export interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string; // YYYY-MM-DD format
    time: string; // HH:mm format
    venue: string;
    league: string;
    category: string; // U16, U19, Amatör, etc.
    referee?: string; // Main referee name
    status: MatchStatus;
    homeScore: number;
    awayScore: number;
    events: MatchEvent[];
    currentMinute?: number; // for live matches
    createdAt: string;
    updatedAt: string;
}

// Type for creating a new match (without id and timestamps)
export type NewMatch = Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'events' | 'homeScore' | 'awayScore'> & {
    homeScore?: number;
    awayScore?: number;
    events?: MatchEvent[];
};

// Type for updating a match
export type UpdateMatch = Partial<Omit<Match, 'id' | 'createdAt'>>;
