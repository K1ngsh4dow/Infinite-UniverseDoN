
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Loader2, Download, Play, Pause, Music as MusicIcon, Mic, Palette } from "lucide-react";
import { generateMusic, GenerateMusicOutput } from "@/ai/flows/generate-music";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreations } from "@/context/CreationsContext";
import { getFriendlyAIError } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSpark } from "@/context/SparkContext";

const STORAGE_KEY = 'iu-music-generation-state';
// const SPARK_FEE = 2;

export default function MusicGenerationPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [musicResult, setMusicResult] = useState<GenerateMusicOutput | null>(null);
  const [encoder, setEncoder] = useState<'stable' | 'experimental'>('stable');
  const [model, setModel] = useState('googleai/gemini-1.5-flash-latest');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { addCreation } = useCreations();
  const isOnline = useOnlineStatus();
  const { spendSpark } = useSpark();

  // Load state from session storage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const { prompt, musicResult } = JSON.parse(savedState);
        setPrompt(prompt || "");
        setMusicResult(musicResult || null);
      }
      const storedModel = localStorage.getItem('infinite-universe-model');
      if (storedModel) {
        setModel(storedModel);
      }
    } catch (error) {
      console.error('Failed to load state from session storage:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save state to session storage on change
  useEffect(() => {
    try {
      const stateToSave = JSON.stringify({ prompt, musicResult });
      sessionStorage.setItem(STORAGE_KEY, stateToSave);
    } catch (error) {
      console.error('Failed to save state to session storage:', error);
    }
  }, [prompt, musicResult]);


  useEffect(() => {
    if (!isOnline && !toast) {
        // toast might not be available on first render
        setTimeout(() => toast && toast({
            title: "You are offline",
            description: "Music generation is disabled until you reconnect.",
            variant: "destructive",
        }), 100);
    }
  }, [isOnline, toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const handlePlaybackEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handlePlaybackEnd);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handlePlaybackEnd);
    };
  }, [musicResult?.audioDataUri]);


  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ title: "You are offline", description: "Please check your connection.", variant: "destructive" });
      return;
    }
    if (!prompt) {
      toast({
        title: "Prompt is required",
        description: "Please enter a theme or idea for your song.",
        variant: "destructive",
      });
      return;
    }
    
    // if (!spendSpark(SPARK_FEE)) return;

    setIsLoading(true);
    setMusicResult(null);
     if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    
    try {
      const result = await generateMusic({ prompt, encoder, model });
      setMusicResult(result);
      await addCreation({
        type: 'music',
        title: result.title,
        prompt,
        path: '/',
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error Generating Song Concept",
        description: getFriendlyAIError(error),
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownload = (url: string, filename: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };


  return (
    <DashboardLayout>
      <PageHeader
        title="AI Music Lab"
        description="Generate song concepts, lyrics, album art, and spoken-word performances from a single idea."
      />
      <div className="space-y-8">
        <form onSubmit={handleGenerateMusic} className="space-y-4">
          <Textarea
            placeholder={isOnline ? "e.g., A blues song about a robot who lost its charging cable." : "Music generation is unavailable offline."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] text-base"
            disabled={isLoading || !isOnline}
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button type="submit" disabled={isLoading || !isOnline} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MusicIcon className="mr-2 h-4 w-4" /> }
                { isLoading ? 'Composing...' : `Generate Song Concept` }
            </Button>
             <RadioGroup
              value={encoder}
              onValueChange={(value) => setEncoder(value as 'stable' | 'experimental')}
              className="flex items-center space-x-4"
              disabled={isLoading || !isOnline}
            >
              <Label className="font-normal text-sm">Audio Encoder:</Label>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stable" id="stable-music" />
                <Label htmlFor="stable-music" className="font-normal">Stable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="experimental" id="experimental-music" />
                <Label htmlFor="experimental-music" className="font-normal">Experimental</Label>
              </div>
            </RadioGroup>
          </div>
        </form>

        {(isLoading || musicResult) && (
          <Card>
            <CardHeader>
               {isLoading && !musicResult ? (
                 <Skeleton className="h-8 w-3/4" />
               ) : (
                <CardTitle>{musicResult?.title}</CardTitle>
              )}
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Album Cover</h3>
                    <div className="aspect-square relative bg-muted rounded-lg">
                        {isLoading && !musicResult ? (
                             <div className="flex flex-col gap-4 items-center justify-center h-full">
                                <Palette className="h-10 w-10 text-muted-foreground animate-pulse"/>
                                <p className="text-muted-foreground">Painting your album art...</p>
                            </div>
                        ) : (
                            musicResult?.imageUrl &&
                            <>
                            <Image
                                src={musicResult.imageUrl}
                                alt={musicResult.title || 'Album cover'}
                                fill
                                className="object-cover rounded-lg"
                                data-ai-hint="album cover"
                            />
                            <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => handleDownload(musicResult.imageUrl!, `album-art-${Date.now()}.png`)}
                                className="absolute top-2 right-2"
                                aria-label="Download image"
                                >
                                <Download className="h-4 w-4" />
                            </Button>
                            </>
                        )}
                    </div>
                </div>

                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Lyrics</h3>
                     {isLoading && !musicResult ? (
                        <div className="space-y-2 h-64 rounded-md border p-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                             <Skeleton className="h-4 w-full mt-4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                        ) : (
                        musicResult?.lyrics &&
                        <ScrollArea className="h-64 rounded-md border p-4 bg-muted/50">
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{musicResult.lyrics}</p>
                        </ScrollArea>
                        )}
                    
                    <h3 className="font-semibold text-lg pt-4">Spoken Word</h3>
                     {isLoading && !musicResult ? (
                        <div className="flex flex-col gap-4 items-center justify-center h-24 bg-muted rounded-lg">
                            <Mic className="h-8 w-8 text-muted-foreground animate-pulse"/>
                            <p className="text-muted-foreground">Recording narration...</p>
                        </div>
                        ) : (
                        musicResult?.audioDataUri &&
                        <>
                            <audio ref={audioRef} src={musicResult.audioDataUri} className="hidden" />
                            <div className="flex items-center space-x-4">
                            <Button size="icon" onClick={togglePlayPause}>
                                {isPlaying ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
                            </Button>
                            <Progress value={progress} className="w-full" />
                            </div>
                        </>
                        )}
                 </div>
            </CardContent>
            {musicResult?.audioDataUri && !isLoading && (
                 <CardFooter>
                    <Button variant="outline" onClick={() => handleDownload(musicResult.audioDataUri!, `song-narration-${Date.now()}.wav`)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Narration
                    </Button>
                </CardFooter>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
