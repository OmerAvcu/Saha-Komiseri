// Category Rule Interface - defines rules for each category
export interface CategoryRule {
    id: string;
    name: string; // U16, U19, U21, Amatör, Profesyonel
    halfDuration: number; // minutes per half
    substitutionLimit: number; // max substitutions allowed
    extraTimeHalfDuration?: number; // minutes per extra time half (if applicable)
    description?: string;
}

// Settings Interface
export interface Settings {
    categories: CategoryRule[];
    defaultCategory: string; // category id
    appVersion: string;
    lastUpdated: string;
}

// Default category rules
export const DEFAULT_CATEGORIES: CategoryRule[] = [
    {
        id: 'u16',
        name: 'U16',
        halfDuration: 40,
        substitutionLimit: 5,
        description: '16 yaş altı maçlar - 2x40 dakika',
    },
    {
        id: 'u17',
        name: 'U17',
        halfDuration: 40,
        substitutionLimit: 5,
        description: '17 yaş altı maçlar - 2x40 dakika',
    },
    {
        id: 'u19',
        name: 'U19',
        halfDuration: 45,
        substitutionLimit: 5,
        description: '19 yaş altı maçlar - 2x45 dakika',
    },
    {
        id: 'u21',
        name: 'U21',
        halfDuration: 45,
        substitutionLimit: 5,
        description: '21 yaş altı maçlar - 2x45 dakika',
    },
    {
        id: 'amateur',
        name: 'Amatör',
        halfDuration: 45,
        substitutionLimit: 5,
        description: 'Amatör lig maçları - 2x45 dakika',
    },
    {
        id: 'professional',
        name: 'Profesyonel',
        halfDuration: 45,
        substitutionLimit: 5,
        extraTimeHalfDuration: 15,
        description: 'Profesyonel maçlar - 2x45 dakika',
    },
];

// Default settings
export const DEFAULT_SETTINGS: Settings = {
    categories: DEFAULT_CATEGORIES,
    defaultCategory: 'u19',
    appVersion: '1.0.0',
    lastUpdated: new Date().toISOString(),
};
