
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Loader2, Download, Play, Pause, BookOpen, Mic, Palette, AlertTriangle } from "lucide-react";
import { generateStory, GenerateStoryOutput } from "@/ai/flows/generate-story";
import { generateImage } from "@/ai/flows/generate-image";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useCreations } from "@/context/CreationsContext";
import { getFriendlyAIError } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSpark } from "@/context/SparkContext";

const STORAGE_KEY = 'iu-story-generation-state';
// const SPARK_FEE = 2;

export default function StoryGenerationPage() {
  const [prompt, setPrompt] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [encoder, setEncoder] = useState<'stable' | 'experimental'>('stable');
  const [model, setModel] = useState('googleai/gemini-1.5-flash-latest');
  
  const [storyResult, setStoryResult] = useState<GenerateStoryOutput | null>(null);
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { addCreation } = useCreations();
  const isOnline = useOnlineStatus();
  const { spendSpark } = useSpark();

  const isLoading = isGeneratingStory || isImageLoading || isAudioLoading;

  // Load state from session storage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const { prompt, storyResult, imageUrl, audioDataUri } = JSON.parse(savedState);
        setPrompt(prompt || "");
        setStoryResult(storyResult || null);
        setImageUrl(imageUrl || null);
        setAudioDataUri(audioDataUri || null);
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
      const stateToSave = JSON.stringify({ prompt, storyResult, imageUrl, audioDataUri });
      sessionStorage.setItem(STORAGE_KEY, stateToSave);
    } catch (error) {
      console.error('Failed to save state to session storage:', error);
    }
  }, [prompt, storyResult, imageUrl, audioDataUri]);


  useEffect(() => {
    if (!isOnline && !toast) {
       setTimeout(() => toast && toast({
        title: "You are offline",
        description: "Story generation is disabled until you reconnect.",
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


  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ title: "You are offline", description: "Please check your connection.", variant: "destructive" });
      return;
    }
    if (!prompt) {
      toast({
        title: "Prompt is required",
        description: "Please enter a prompt to generate a story.",
        variant: "destructive",
      });
      return;
    }
    
    // if (!spendSpark(SPARK_FEE)) return;

    // Reset all states
    setIsGeneratingStory(true);
    setStoryResult(null);
    setImageUrl(null);
    setAudioDataUri(null);
    setIsImageLoading(false);
    setImageError(null);
    setIsAudioLoading(false);
    setAudioError(null);
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    
    try {
      // 1. Generate the core story content first
      const storyData = await generateStory({ prompt, model });
      setStoryResult(storyData);
      setIsGeneratingStory(false);

      // 2. Start media generation in parallel
      setIsImageLoading(true);
      setIsAudioLoading(true);

      const imagePromise = generateImage({ prompt: storyData.imagePrompt });
      const audioPromise = textToSpeech({ text: `Title: ${storyData.title}. Story: ${storyData.story}`, encoder });

      const [imageResult, audioResult] = await Promise.allSettled([imagePromise, audioPromise]);

      let finalImageUrl: string | null = null;
      if (imageResult.status === 'fulfilled') {
        finalImageUrl = imageResult.value.imageUrl;
        setImageUrl(finalImageUrl);
      } else {
        console.error("Image generation failed:", imageResult.reason);
        setImageError(getFriendlyAIError(imageResult.reason));
      }
      setIsImageLoading(false);

      let finalAudioDataUri: string | null = null;
      if (audioResult.status === 'fulfilled') {
        finalAudioDataUri = audioResult.value.audioDataUri;
        setAudioDataUri(finalAudioDataUri);
      } else {
        console.error("Audio generation failed:", audioResult.reason);
        setAudioError(getFriendlyAIError(audioResult.reason));
      }
      setIsAudioLoading(false);
      
      // Add the complete creation to the context
      await addCreation({
        type: 'story',
        title: storyData.title,
        prompt,
        path: '/',
        data: { 
            ...storyData,
            imageUrl: finalImageUrl,
            audioDataUri: finalAudioDataUri
        },
      });

    } catch (error) {
      console.error(error);
      setIsGeneratingStory(false);
      toast({
        title: "Error Generating Story",
        description: getFriendlyAIError(error),
        variant: "destructive",
      });
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

  const showResults = storyResult || isGeneratingStory;

  return (
    <DashboardLayout>
      <PageHeader
        title="Story Generation"
        description="Turn your ideas into illustrated and narrated short stories."
      />
      <div className="space-y-8">
        <form onSubmit={handleGenerateStory} className="space-y-4">
          <Textarea
            placeholder={isOnline ? "e.g., A friendly dragon who is afraid of heights." : "Story generation is unavailable offline."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] text-base"
            disabled={isLoading || !isOnline}
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button type="submit" disabled={isLoading || !isOnline} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
              {isGeneratingStory ? 'Writing...' : isLoading ? 'Generating...' : `Generate Story`}
            </Button>
            <RadioGroup
              value={encoder}
              onValueChange={(value) => setEncoder(value as 'stable' | 'experimental')}
              className="flex items-center space-x-4"
              disabled={isLoading || !isOnline}
            >
              <Label className="font-normal text-sm">Audio Encoder:</Label>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stable" id="stable-story" />
                <Label htmlFor="stable-story" className="font-normal">Stable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="experimental" id="experimental-story" />
                <Label htmlFor="experimental-story" className="font-normal">Experimental</Label>
              </div>
            </RadioGroup>
          </div>
        </form>

        {showResults && (
          <Card>
            <CardHeader>
              {storyResult ? (
                <CardTitle>{storyResult.title}</CardTitle>
              ) : (
                <Skeleton className="h-8 w-3/4" />
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Illustration</h3>
                <div className="aspect-video relative bg-muted rounded-lg flex items-center justify-center">
                  {isImageLoading ? (
                     <div className="flex flex-col gap-4 items-center justify-center h-full text-muted-foreground">
                        <Palette className="h-10 w-10 animate-pulse"/>
                        <p>Creating your illustration...</p>
                    </div>
                  ) : imageError ? (
                    <div className="flex flex-col gap-4 items-center justify-center h-full text-destructive p-4 text-center">
                      <AlertTriangle className="h-10 w-10"/>
                      <p>{imageError}</p>
                    </div>
                  ) : imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt={storyResult?.title || 'Story illustration'}
                        fill
                        className="object-contain rounded-lg"
                        data-ai-hint="story illustration"
                      />
                       <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleDownload(imageUrl, `story-image-${Date.now()}.png`)}
                        className="absolute top-2 right-2"
                        aria-label="Download image"
                        >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    storyResult && <div className="text-muted-foreground">Waiting to generate...</div>
                  )}
                </div>
              </div>

              {storyResult && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Story</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{storyResult.story}</p>
                </div>
              )}
              
              <div className="space-y-4">
                 <h3 className="font-semibold text-lg">Narration</h3>
                 <div className="bg-muted rounded-lg p-4 min-h-[96px] flex items-center justify-center">
                    {isAudioLoading ? (
                      <div className="flex flex-col gap-4 items-center justify-center h-full text-muted-foreground">
                          <Mic className="h-8 w-8 animate-pulse"/>
                          <p>Generating voiceover...</p>
                      </div>
                    ) : audioError ? (
                      <div className="flex flex-col gap-4 items-center justify-center h-full text-destructive p-4 text-center">
                        <AlertTriangle className="h-8 w-8"/>
                        <p>{audioError}</p>
                      </div>
                    ) : audioDataUri ? (
                      <div className="w-full">
                        <audio ref={audioRef} src={audioDataUri} className="hidden" />
                        <div className="flex items-center space-x-4">
                          <Button size="icon" onClick={togglePlayPause}>
                            {isPlaying ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
                          </Button>
                          <Progress value={progress} className="w-full" />
                        </div>
                      </div>
                    ) : (
                      storyResult && <div className="text-muted-foreground">Waiting to generate...</div>
                    )}
                 </div>
              </div>
            </CardContent>
            {audioDataUri && (
                 <CardFooter>
                    <Button variant="outline" onClick={() => handleDownload(audioDataUri, `story-audio-${Date.now()}.wav`)}>
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
