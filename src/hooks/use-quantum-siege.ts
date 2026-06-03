
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getFriendlyAIError } from '@/lib/utils';
import { generateSiegeWave, GenerateSiegeWaveOutput } from '@/ai/flows/generate-siege-wave-flow';

const GRID_SIZE = 15;
const CELL_SIZE = 40; // in pixels

// Define a simple path for enemies
const ENEMY_PATH = [
    { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 2, y: 6 }, { x: 2, y: 5 },
    { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 5 },
    { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }, { x: 5, y: 9 }, { x: 6, y: 9 },
    { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 8, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 6 },
    { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 },
    { x: 11, y: 3 }, { x: 12, y: 3 }, { x: 12, y: 4 }, { x: 12, y: 5 }, { x: 12, y: 6 },
    { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 },
];

export const TOWER_TYPES = {
    TURRET: { name: 'Turret', cost: 100, damage: 5, range: 2.5, fireRate: 10 }, // fires every 10 frames
    CANNON: { name: 'Cannon', cost: 250, damage: 20, range: 3.5, fireRate: 40 }, // fires every 40 frames
};

type TowerType = keyof typeof TOWER_TYPES;

interface PlacedTower {
    id: number;
    type: TowerType;
    x: number;
    y: number;
    cooldown: number;
}

interface Enemy {
    id: number;
    name: string;
    health: number;
    maxHealth: number;
    speed: number;
    x: number;
    y: number;
    pathIndex: number;
    value: number; // constructs awarded on defeat
}

interface Projectile {
    id: number;
    x: number;
    y: number;
    targetId: number;
    damage: number;
}

type GamePhase = 'LOADING' | 'BUILD' | 'WAVE' | 'GAME_OVER';

export function useQuantumSiege() {
    const { toast } = useToast();
    const isOnline = useOnlineStatus();
    const gameLoopRef = useRef<number>();

    const [phase, setPhase] = useState<GamePhase>('LOADING');
    const [coreHealth, setCoreHealth] = useState(20);
    const [constructs, setConstructs] = useState(400);
    const [waveNumber, setWaveNumber] = useState(0);

    const [grid, setGrid] = useState<number[][]>(() => Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
    const [towers, setTowers] =useState<PlacedTower[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    
    const [currentWave, setCurrentWave] = useState<GenerateSiegeWaveOutput | null>(null);
    const [isWaveSpawning, setIsWaveSpawning] = useState(false);

    // Game Setup
    useEffect(() => {
        if (!isOnline) {
            toast({ title: 'Offline', description: 'Quantum Siege requires an internet connection.', variant: 'destructive' });
            setPhase('GAME_OVER');
            return;
        }
        
        const pathGrid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
        ENEMY_PATH.forEach(p => { if (p.y < GRID_SIZE && p.x < GRID_SIZE) pathGrid[p.y][p.x] = 1; });
        setGrid(pathGrid);
        setPhase('BUILD');
        
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [isOnline, toast]);

    const handlePlaceTower = (row: number, col: number, type: TowerType) => {
        if (phase !== 'BUILD' || grid[row][col] !== 0) return;
        
        const cost = TOWER_TYPES[type].cost;
        if (constructs < cost) {
            toast({ title: "Insufficient Constructs", variant: 'destructive' });
            return;
        }

        setConstructs(c => c - cost);
        setTowers(t => [...t, { id: Date.now(), type, x: col, y: row, cooldown: 0 }]);
        const newGrid = [...grid];
        newGrid[row][col] = 2; // Mark as tower placed
        setGrid(newGrid);
    };

    const startWave = async () => {
        if (isWaveSpawning) return;
        setWaveNumber(w => w + 1);
        setPhase('WAVE');
        setIsWaveSpawning(true);

        try {
            const waveData = await generateSiegeWave({ waveNumber: waveNumber + 1, playerHealth: coreHealth, playerResources: constructs });
            setCurrentWave(waveData);
            
            let enemyIdCounter = 0;
            for (const group of waveData.wave) {
                for (let i = 0; i < group.count; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500)); // Stagger spawns
                    setEnemies(prev => [...prev, {
                        id: Date.now() + enemyIdCounter++,
                        name: group.name,
                        health: group.health,
                        maxHealth: group.health,
                        speed: group.speed,
                        pathIndex: 0,
                        x: ENEMY_PATH[0].x * CELL_SIZE + CELL_SIZE / 2,
                        y: ENEMY_PATH[0].y * CELL_SIZE + CELL_SIZE / 2,
                        value: Math.ceil(group.health / 10),
                    }]);
                }
            }
        } catch (e) {
            toast({ title: 'Failed to generate wave', description: getFriendlyAIError(e), variant: 'destructive' });
            setPhase('BUILD'); // Go back to build phase on error
        } finally {
            setIsWaveSpawning(false);
        }
    };
    
    // Main Game Loop
    const gameTick = useCallback(() => {
        // --- Enemy Movement ---
        setEnemies(prevEnemies => prevEnemies.map(enemy => {
            if (enemy.pathIndex >= ENEMY_PATH.length - 1) {
                setCoreHealth(h => h - 1);
                return null; // Remove enemy
            }
            const targetNode = ENEMY_PATH[enemy.pathIndex + 1];
            const targetX = targetNode.x * CELL_SIZE + CELL_SIZE / 2;
            const targetY = targetNode.y * CELL_SIZE + CELL_SIZE / 2;
            
            const dx = targetX - enemy.x;
            const dy = targetY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < enemy.speed) {
                return { ...enemy, pathIndex: enemy.pathIndex + 1, x: targetX, y: targetY };
            } else {
                return { ...enemy, x: enemy.x + (dx / dist) * enemy.speed, y: enemy.y + (dy / dist) * enemy.speed };
            }
        }).filter(e => e !== null) as Enemy[]);
        
        // --- Tower Firing ---
        setTowers(prevTowers => prevTowers.map(tower => {
            const towerInfo = TOWER_TYPES[tower.type];
            let newCooldown = Math.max(0, tower.cooldown - 1);

            if (newCooldown === 0) {
                const towerX = tower.x * CELL_SIZE + CELL_SIZE / 2;
                const towerY = tower.y * CELL_SIZE + CELL_SIZE / 2;
                
                let target: Enemy | null = null;
                let min_dist = Infinity;

                for (const enemy of enemies) {
                    const dx = enemy.x - towerX;
                    const dy = enemy.y - towerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= towerInfo.range * CELL_SIZE && dist < min_dist) {
                        min_dist = dist;
                        target = enemy;
                    }
                }
                
                if (target) {
                    setProjectiles(p => [...p, { id: Date.now() + Math.random(), x: towerX, y: towerY, targetId: target!.id, damage: towerInfo.damage }]);
                    newCooldown = towerInfo.fireRate;
                }
            }
            return { ...tower, cooldown: newCooldown };
        }));

        // --- Projectile Movement & Collision ---
        setProjectiles(prevProjectiles => {
            const stillActive: Projectile[] = [];
            prevProjectiles.forEach(proj => {
                const target = enemies.find(e => e.id === proj.targetId);
                if (!target) return; // Target already gone
                
                const dx = target.x - proj.x;
                const dy = target.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const projectileSpeed = 15;
                
                if (dist < projectileSpeed) {
                    setEnemies(prevEnemies => prevEnemies.map(e => e.id === proj.targetId ? { ...e, health: e.health - proj.damage } : e));
                } else {
                    stillActive.push({ ...proj, x: proj.x + (dx / dist) * projectileSpeed, y: proj.y + (dy / dist) * projectileSpeed });
                }
            });
            return stillActive;
        });

        // --- Enemy Cleanup ---
        const defeatedEnemies = enemies.filter(e => e.health <= 0);
        if (defeatedEnemies.length > 0) {
            const constructsGained = defeatedEnemies.reduce((acc, e) => acc + e.value, 0);
            setConstructs(c => c + constructsGained);
            setEnemies(prev => prev.filter(e => e.health > 0));
        }
        
        // --- Check for wave end ---
        if (!isWaveSpawning && enemies.length === 0) {
            setPhase('BUILD');
            setCurrentWave(null);
            const waveBonus = 50 + waveNumber * 10;
            setConstructs(c => c + waveBonus);
            toast({ title: `Wave ${waveNumber} Cleared!`, description: `+${waveBonus} Constructs` });
        }
        
        // --- Check for Game Over ---
        if (coreHealth <= 0) {
            setPhase('GAME_OVER');
        }

    }, [phase, enemies, isWaveSpawning, waveNumber, coreHealth, toast]);
    
    useEffect(() => {
        if (phase === 'WAVE') {
            gameLoopRef.current = requestAnimationFrame(gameTick);
        } else {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [phase, gameTick]);

    return {
        phase,
        coreHealth,
        constructs,
        waveNumber,
        grid,
        towers,
        enemies,
        projectiles,
        isWaveSpawning,
        currentWave,
        handlePlaceTower,
        startWave,
    };
}
