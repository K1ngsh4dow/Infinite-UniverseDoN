
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Heart, Play, TowerControl, CircleDollarSign, X } from 'lucide-react';
import { useQuantumSiege, TOWER_TYPES } from '@/hooks/use-quantum-siege';

const GRID_SIZE = 15;
const CELL_SIZE = 40; // in pixels

export function QuantumSiege() {
    const {
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
    } = useQuantumSiege();

    const [selectedTower, setSelectedTower] = useState<keyof typeof TOWER_TYPES | null>(null);
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

    const onTowerPlacement = (row: number, col: number) => {
        if (!selectedTower) return;
        handlePlaceTower(row, col, selectedTower);
        setSelectedTower(null);
    }
    
    const memoizedGrid = useMemo(() => (
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
            {grid.map((row, r) => row.map((cell, c) => (
                <div
                    key={`${r}-${c}`}
                    className={`border border-gray-700/50 ${cell === 1 ? 'bg-gray-800' : 'bg-gray-900'} ${selectedTower && cell === 0 ? 'cursor-pointer hover:bg-green-900/50' : ''}`}
                    onClick={() => onTowerPlacement(r, c)}
                    onMouseEnter={() => selectedTower && cell === 0 && setHoveredCell({ row: r, col: c })}
                    onMouseLeave={() => setHoveredCell(null)}
                >
                </div>
            )))}
        </div>
    ), [grid, selectedTower]);

    if (phase === 'LOADING') {
        return <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }
    
     if (phase === 'GAME_OVER') {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gray-900 text-white">
                <h2 className="text-4xl font-bold text-destructive">Core Destroyed</h2>
                <p className="text-lg text-muted-foreground">You survived until wave {waveNumber}.</p>
                <Button onClick={() => window.location.reload()}>Retry Siege</Button>
            </div>
        );
    }
    
    return (
        <div className="flex h-full w-full bg-gray-900 p-4">
            {/* Game Board */}
            <div className="relative" style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}>
                {memoizedGrid}
                {hoveredCell && selectedTower && (
                    <div
                        className="absolute bg-green-500/20 rounded-full border-2 border-dashed border-green-500 pointer-events-none"
                        style={{
                            width: TOWER_TYPES[selectedTower].range * CELL_SIZE * 2,
                            height: TOWER_TYPES[selectedTower].range * CELL_SIZE * 2,
                            left: hoveredCell.col * CELL_SIZE + CELL_SIZE / 2 - (TOWER_TYPES[selectedTower].range * CELL_SIZE),
                            top: hoveredCell.row * CELL_SIZE + CELL_SIZE / 2 - (TOWER_TYPES[selectedTower].range * CELL_SIZE),
                        }}
                    />
                )}
                {towers.map(tower => {
                    const towerInfo = TOWER_TYPES[tower.type];
                    return (
                        <div key={tower.id} className="absolute flex items-center justify-center" style={{ left: tower.x * CELL_SIZE, top: tower.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}>
                            <div className="absolute rounded-full bg-gray-500/10" style={{ width: towerInfo.range * CELL_SIZE * 2, height: towerInfo.range * CELL_SIZE * 2 }}></div>
                             <div className={`w-8 h-8 rounded-full ${tower.type === 'TURRET' ? 'bg-blue-500' : 'bg-orange-500'} flex items-center justify-center text-white font-bold`}>{tower.type[0]}</div>
                        </div>
                    )
                })}
                {enemies.map(enemy => (
                     <div key={enemy.id} className="absolute w-6 h-6 bg-red-600 rounded-full" style={{ left: enemy.x - 12, top: enemy.y - 12, transition: 'all 0.1s linear' }}>
                        <div className="absolute -top-3 w-full h-1 bg-gray-700 rounded"><div className="h-full bg-red-400 rounded" style={{width: `${(enemy.health/enemy.maxHealth) * 100}%`}}></div></div>
                     </div>
                ))}
                 {projectiles.map(p => (
                    <div key={p.id} className="absolute w-2 h-2 bg-yellow-300 rounded-full" style={{ left: p.x - 4, top: p.y - 4 }} />
                ))}
            </div>

            {/* UI Panel */}
            <div className="flex flex-col flex-1 pl-4 text-white space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="flex-row items-center justify-between p-3">
                        <CardTitle className="text-lg">Core Status</CardTitle>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 font-bold"><Heart className="text-red-500"/> {coreHealth}</div>
                            <div className="flex items-center gap-2 font-bold"><CircleDollarSign className="text-yellow-500"/> {constructs}</div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <span>Wave: {waveNumber}</span>
                             {phase === 'BUILD' ? (
                                <Button size="sm" onClick={startWave} disabled={isWaveSpawning}>
                                    {isWaveSpawning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Play className="mr-2 h-4 w-4" />}
                                    Start Wave {waveNumber + 1}
                                </Button>
                             ) : (
                                <span className="text-sm text-red-400 animate-pulse">WAVE IN PROGRESS</span>
                             )}
                        </div>
                         {currentWave && <p className="text-xs text-muted-foreground mt-1">Incoming: {currentWave.waveName}</p>}
                    </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="p-3">
                        <CardTitle className="text-lg">Defenses</CardTitle>
                    </CardHeader>
                     <CardContent className="p-3 space-y-2">
                        {Object.entries(TOWER_TYPES).map(([key, tower]) => (
                            <Button
                                key={key}
                                variant={selectedTower === key ? 'secondary' : 'outline'}
                                className="w-full justify-between"
                                onClick={() => setSelectedTower(prev => prev === key ? null : key as keyof typeof TOWER_TYPES)}
                                disabled={phase !== 'BUILD'}
                            >
                                <span><TowerControl className="inline-block mr-2 h-4 w-4"/>{tower.name}</span>
                                <span className="flex items-center gap-1"><CircleDollarSign className="h-4 w-4"/>{tower.cost}</span>
                            </Button>
                        ))}
                         {selectedTower && <Button size="sm" variant="ghost" className="w-full" onClick={() => setSelectedTower(null)}><X className="mr-2 h-4 w-4"/>Cancel Placement</Button>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
