
"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Download, Play, Pause, Mic } from "lucide-react";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useCreations } from "@/context/CreationsContext";
import { getFriendlyAIError } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSpark } from "@/context/SparkContext";

const STORAGE_KEY = 'iu-speech-generation-state';
// const SPARK_FEE = 1;

export default function SpeechGenerationPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [encoder, setEncoder] = useState<'stable' | 'experimental'>('stable');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
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
        const { text, audioDataUri } = JSON.parse(savedState);
        setText(text || "");
        setAudioDataUri(audioDataUri || null);
      }
    } catch (error) {
      console.error('Failed to load state from session storage:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save state to session storage on change
  useEffect(() => {
    try {
      const stateToSave = JSON.stringify({ text, audioDataUri });
      sessionStorage.setItem(STORAGE_KEY, stateToSave);
    } catch (error) {
      console.error('Failed to save state to session storage:', error);
    }
  }, [text, audioDataUri]);

  useEffect(() => {
    if (!isOnline && !toast) {
       setTimeout(() => toast && toast({
        title: "You are offline",
        description: "Speech generation is disabled until you reconnect.",
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
  }, [audioDataUri]);


  const handleGenerateSpeech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ title: "You are offline", description: "Please check your connection.", variant: "destructive" });
      return;
    }
    if (!text) {
      toast({
        title: "Text is required",
        description: "Please enter some text to generate speech.",
        variant: "destructive",
      });
      return;
    }
    
    // if (!spendSpark(SPARK_FEE)) return;
    
    setIsLoading(true);
    setAudioDataUri(null);
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    
    try {
      const result = await textToSpeech({ text, encoder });
      setAudioDataUri(result.audioDataUri);
      await addCreation({
        type: 'speech',
        title: `Speech: "${text.substring(0, 25)}..."`,
        prompt: text,
        path: '/',
        data: { audioDataUri: result.audioDataUri, text },
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Speech",
        description: getFriendlyAIError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (audioDataUri) {
      const link = document.createElement('a');
      link.href = audioDataUri;
      link.download = `infinite-universe-speech-${Date.now()}.wav`;
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
        title="Text-to-Speech"
        description="Convert written text into natural-sounding speech."
      />
      <div className="space-y-8">
        <form onSubmit={handleGenerateSpeech} className="space-y-4">
          <Textarea
            placeholder={isOnline ? "Enter text to convert to speech..." : "Speech generation is unavailable offline."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[150px] text-base"
            disabled={isLoading || !isOnline}
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button type="submit" disabled={isLoading || !isOnline} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
              {isLoading ? 'Generating...' : `Generate Speech`}
            </Button>
            <RadioGroup
              value={encoder}
              onValueChange={(value) => setEncoder(value as 'stable' | 'experimental')}
              className="flex items-center space-x-4"
              disabled={isLoading || !isOnline}
            >
              <Label className="font-normal text-sm">Audio Encoder:</Label>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stable" id="stable" />
                <Label htmlFor="stable" className="font-normal">Stable (Recommended)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="experimental" id="experimental" />
                <Label htmlFor="experimental" className="font-normal">Experimental</Label>
              </div>
            </RadioGroup>
          </div>
        </form>

        {(isLoading || audioDataUri) && (
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center space-x-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Generating audio, please wait...</p>
                </div>
              ) : (
                audioDataUri && (
                  <>
                    <audio ref={audioRef} src={audioDataUri} className="hidden" />
                    <div className="flex items-center space-x-4">
                       <Button size="icon" onClick={togglePlayPause}>
                        {isPlaying ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
                      </Button>
                      <Progress value={progress} className="w-full" />
                    </div>
                  </>
                )
              )}
            </CardContent>
            {audioDataUri && !isLoading && (
                 <CardFooter>
                    <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Audio
                    </Button>
                </CardFooter>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
