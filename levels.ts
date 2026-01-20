
import { LevelData } from './types';

export const LEVELS: LevelData[] = [
    {
        id: 1,
        name: "Rhythmic Fields",
        theme: 'GRASS',
        width: 100,
        height: 15,
        startPos: { x: 2, y: 12 },
        goal: { x: 95, y: 12 },
        blocks: [
            ...Array.from({length: 100}, (_, i) => ({x: i, y: 14})), // Floor
            {x: 10, y: 11}, {x: 11, y: 11}, {x: 12, y: 11}, // First platform
            {x: 20, y: 10}, {x: 21, y: 10},
            {x: 25, y: 12}, {x: 26, y: 12},
            {x: 35, y: 11}, {x: 36, y: 11}, {x: 37, y: 11},
            {x: 45, y: 9}, {x: 46, y: 9},
            {x: 55, y: 12}, {x: 60, y: 10}, {x: 65, y: 8},
        ],
        enemies: [
            {x: 15, y: 13},
            {x: 30, y: 13},
            {x: 48, y: 13},
            {x: 62, y: 13},
        ],
        coins: [
            {x: 11, y: 10}, {x: 20, y: 9}, {x: 36, y: 10}, {x: 65, y: 7}
        ]
    },
    {
        id: 2,
        name: "Deep Bass Cave",
        theme: 'CAVE',
        width: 120,
        height: 15,
        startPos: { x: 2, y: 12 },
        goal: { x: 115, y: 12 },
        blocks: [
            ...Array.from({length: 120}, (_, i) => ({x: i, y: 14})), // Floor
            ...Array.from({length: 120}, (_, i) => ({x: i, y: 0})), // Ceiling
            {x: 15, y: 13}, {x: 15, y: 12}, // Pillar
            {x: 25, y: 10}, {x: 26, y: 10}, {x: 27, y: 10},
            {x: 35, y: 13}, {x: 35, y: 12}, {x: 35, y: 11},
            {x: 50, y: 10}, {x: 51, y: 10}, {x: 52, y: 10}, {x: 53, y: 10},
            {x: 70, y: 8}, {x: 71, y: 8}, {x: 72, y: 8},
            {x: 90, y: 10}, {x: 91, y: 10}, {x: 95, y: 8}, {x: 96, y: 8},
        ],
        enemies: [
            {x: 20, y: 13}, {x: 40, y: 13}, {x: 60, y: 13}, {x: 80, y: 13}, {x: 100, y: 13}
        ],
        coins: [
            {x: 26, y: 9}, {x: 51, y: 9}, {x: 71, y: 7}, {x: 95, y: 7}
        ]
    }
];
