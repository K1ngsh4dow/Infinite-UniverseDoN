
'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyAIError } from '@/lib/utils';
import { generateItinerary } from '@/ai/flows/generate-itinerary-flow';
import { Loader2, Compass, FileText, Globe as GlobeIcon, Users, Home, MapPin, AreaChart, Sparkles } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Stars, Sphere, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { geoCentroid } from 'd3-geo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { countriesData, CountryData } from '@/lib/countries-data';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
const TEXTURES = {
    day: 'https://unpkg.com/three-globe@2.27.0/example/img/earth-day.jpg',
};

interface GeoJsonFeature {
    type: 'Feature';
    properties: { NAME: string; [key: string]: any; };
    geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: any; };
}

function GlobeComponent({ onCountryClick }: { onCountryClick: (country: any) => void }) {
    const [countries, setCountries] = useState<{ features: GeoJsonFeature[] }>({ features: [] });
    const texture = useMemo(() => new THREE.TextureLoader().load(TEXTURES.day), []);
    
    useEffect(() => {
        fetch(GEOJSON_URL).then(res => res.json()).then(data => setCountries(data));
    }, []);
    
    const countryPoints = useMemo(() => {
        return countries.features.map(feature => {
            if (!feature.geometry) return null;
            const centroid = geoCentroid(feature);
            if (!centroid || !isFinite(centroid[0]) || !isFinite(centroid[1])) return null;
            
            const phi = (90 - centroid[1]) * (Math.PI / 180);
            const theta = (centroid[0] + 180) * (Math.PI / 180);
            const x = -(1.01 * Math.sin(phi) * Math.cos(theta));
            const z = 1.01 * Math.sin(phi) * Math.sin(theta);
            const y = 1.01 * Math.cos(phi);
            return { feature, position: [x,y,z] as [number, number, number] };
        }).filter(Boolean);
    }, [countries]);

    return (
        <>
            <ambientLight intensity={1.2} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade />
            <Suspense fallback={null}>
                 <Sphere args={[1, 64, 64]}>
                    <meshStandardMaterial map={texture} />
                </Sphere>
                 {countryPoints.map(({ feature, position }, index) => (
                    <Sphere 
                        key={index} 
                        args={[0.015, 16, 16]} 
                        position={position}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCountryClick(feature);
                        }}
                    >
                        <meshBasicMaterial color="white" transparent opacity={0.6} />
                    </Sphere>
                ))}
            </Suspense>
            <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.2} />
        </>
    );
}

export function Atlas() {
    const { toast } = useToast();
    const { setPendingMessage, toggleChat } = useChatWidget();
    const isMobile = useIsMobile();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [selectedCountryInfo, setSelectedCountryInfo] = useState<CountryData | null>(null);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleCountryClick = (countryGeo: GeoJsonFeature) => {
        const countryName = countryGeo.properties.NAME;
        const countryInfo = countriesData.find(c => c.name.common === countryName || c.name.official === countryName) || null;
        setSelectedCountryInfo(countryInfo);
    };
    
    const handleGenerateItinerary = () => {
        if (!selectedCountryInfo) return;
        const prompt = `Plan a 7-day moderate budget trip to ${selectedCountryInfo.name.common} for 2 people, interested in history and food.`;
        const toolCall = {
            tool: "itineraryPlanner",
            summary: `Okay, planning a trip to ${selectedCountryInfo.name.common}.`,
            parameters: {
                location: selectedCountryInfo.name.common,
                duration: 7,
                interests: "history, food",
                budget: "moderate",
                numberOfPeople: 2
            }
        };
        const message = "```json\n" + JSON.stringify(toolCall, null, 2) + "\n```";

        if (isMobile) {
            localStorage.setItem('mobile-chat-pending-message', message);
            router.push('/chat');
        } else {
            setPendingMessage(message);
            toggleChat();
        }
    }

    if (!isClient) {
        return <div className="flex h-full w-full items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>;
    }

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="flex-grow relative">
                <Canvas camera={{ position: [0, 0, 3] }}>
                    <GlobeComponent onCountryClick={handleCountryClick} />
                </Canvas>
            </div>
            <div className="flex-shrink-0 h-2/5 bg-background border-t-2 border-primary/50 p-4">
                <ScrollArea className="h-full">
                    <div className="pr-4">
                         <h2 className="text-2xl font-semibold mb-4">Atlas Explorer</h2>
                        {!selectedCountryInfo && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <GlobeIcon className="h-16 w-16 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-semibold">Select a country</h3>
                                <p className="mt-2 text-muted-foreground">Click a point on the globe to get started.</p>
                            </div>
                        )}
                        {selectedCountryInfo && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-3xl font-headline font-bold">{selectedCountryInfo.name.common}</h3>
                                        <p className="text-muted-foreground">{selectedCountryInfo.name.official}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleGenerateItinerary} size="sm"><Compass className="mr-2 h-4 w-4" />Generate Itinerary with AI</Button>
                                    </div>
                                </div>
                                <Separator />
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle>Country Data</CardTitle>
                                        <CardDescription>Factual information from the local database.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="font-semibold text-muted-foreground flex items-center gap-2"><Home className="h-4 w-4"/>Capital</div>
                                        <div>{selectedCountryInfo.capital?.join(', ') || 'N/A'}</div>

                                        <div className="font-semibold text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4"/>Region</div>
                                        <div>{selectedCountryInfo.region}</div>

                                        <div className="font-semibold text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4"/>Subregion</div>
                                        <div>{selectedCountryInfo.subregion || 'N/A'}</div>

                                        <div className="font-semibold text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/>Population</div>
                                        <div>{selectedCountryInfo.population.toLocaleString()}</div>
                                        
                                        <div className="font-semibold text-muted-foreground flex items-center gap-2"><AreaChart className="h-4 w-4"/>Area</div>
                                        <div>{selectedCountryInfo.area.toLocaleString()} km²</div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
