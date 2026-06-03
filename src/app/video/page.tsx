
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import JSZip from "jszip";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";


import { generateVideoConcept } from "@/ai/flows/generate-video";
import { generateImage } from "@/ai/flows/generate-image";
import { textToSpeech } from "@/ai/flows/text-to-speech";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Film, Wand2, AlertTriangle, Mic, Play, Pause, Package, DownloadCloud, FileVideo2, FileImage, FileAudio2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { useCreations } from "@/context/CreationsContext";
import { getFriendlyAIError } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useWallet } from "@/context/WalletContext";
import { useSpark } from "@/context/SparkContext";


interface VideoPackage {
  title: string;
  imageUrls: (string | null)[];
  script: string;
  audioDataUri: string | null;
}

interface StoredState {
  prompt: string;
  videoPackage: VideoPackage | null;
}

type ExportFormat = 'mp4' | 'gif' | 'wav' | 'mp3' | 'aac' | 'zip';

const STORAGE_KEY = 'iu-video-generation-state';
// const GENERATE_SPARK_FEE = 3;
const EXPORT_DON_FEE = 5;

export default function VideoGenerationPage() {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();
  const { addCreation } = useCreations();
  const isOnline = useOnlineStatus();
  const { debit } = useWallet();
  const { spendSpark } = useSpark();
  
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const [videoPackage, setVideoPackage] = useState<VideoPackage | null>(null);
  
  const [imageError, setImageError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  
  const [frameDuration, setFrameDuration] = useState(5);
  const [model, setModel] = useState('googleai/gemini-1.5-flash-latest');

  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>()
  const currentFrameRef = useRef<number>(0);

  const isAnythingLoading = isGeneratingConcept || isGeneratingImages || isGeneratingAudio;

  // Load state from session storage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const { prompt, videoPackage } = JSON.parse(savedState) as StoredState;
        setPrompt(prompt || "");
        setVideoPackage(videoPackage || null);
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
      const stateToSave: StoredState = { prompt, videoPackage };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save state to session storage:', error);
    }
  }, [prompt, videoPackage]);


  useEffect(() => {
    if (!isOnline) {
      toast({
        title: "You are offline",
        description: "Video generation is disabled until you reconnect.",
        variant: "destructive",
      });
    }
  }, [isOnline, toast]);
  
  // AV Sync Effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !carouselApi) return;

    const handleTimeUpdate = () => {
      const newFrameIndex = Math.floor(audio.currentTime / frameDuration);
      if (newFrameIndex !== currentFrameRef.current && carouselApi.scrollSnapList().length > newFrameIndex) {
        currentFrameRef.current = newFrameIndex;
        carouselApi.scrollTo(newFrameIndex);
      }
    };
    
    const handlePlay = () => {
      // Reset to first frame on play if it was at the end or beginning
      if (audio.currentTime === 0) {
        currentFrameRef.current = 0;
        carouselApi.scrollTo(0);
      }
    }
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);

    return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('play', handlePlay);
    };

  }, [carouselApi, audioRef, frameDuration]);


  const resetState = () => {
    setIsGeneratingConcept(false);
    setIsGeneratingImages(false);
    setIsGeneratingAudio(false);
    setVideoPackage(null);
    setImageError(null);
    setAudioError(null);
    setIsExporting(null);
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setAudioProgress(0);
  }

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ title: "You are offline", description: "Please check your connection.", variant: "destructive" });
      return;
    }
    if (!prompt) {
      toast({ title: "Prompt is required", variant: "destructive" });
      return;
    }
    
    // if (!spendSpark(GENERATE_SPARK_FEE)) return;

    resetState();
    setIsGeneratingConcept(true);

    try {
      const conceptResult = await generateVideoConcept({ prompt, model });
      setIsGeneratingConcept(false);
      
      setVideoPackage({
        title: conceptResult.title,
        script: conceptResult.narrationScript,
        imageUrls: Array(4).fill(null),
        audioDataUri: null,
      });

      setIsGeneratingImages(true);
      setIsGeneratingAudio(true);

      const imagePromises = conceptResult.storyboardPrompts.map(p => generateImage({ prompt: p, model }));
      const audioPromise = textToSpeech({ text: `Title: ${conceptResult.title}. \n ${conceptResult.narrationScript}` });

      const [imageResults, audioResult] = await Promise.allSettled([Promise.all(imagePromises), audioPromise]);

      let finalImageUrls: (string | null)[] = Array(4).fill(null);
      if (imageResults.status === 'fulfilled') {
        finalImageUrls = imageResults.value.map(r => r.imageUrl);
      } else {
        setImageError(getFriendlyAIError(imageResults.reason));
      }
      setIsGeneratingImages(false);
      
      let finalAudioDataUri: string | null = null;
      if (audioResult.status === 'fulfilled') {
        finalAudioDataUri = audioResult.value.audioDataUri;
      } else {
        setAudioError(getFriendlyAIError(audioResult.reason));
      }
      setIsGeneratingAudio(false);
      
      setVideoPackage(prev => prev ? { ...prev, imageUrls: finalImageUrls, audioDataUri: finalAudioDataUri } : null);

      await addCreation({
        type: 'video',
        title: conceptResult.title,
        prompt,
        path: '/',
        data: { imageUrls: finalImageUrls.filter((url): url is string => url !== null) },
      });

    } catch (error: any) {
      resetState();
      toast({ title: "Error Generating Video Concept", description: getFriendlyAIError(error), variant: "destructive" });
    }
  };

  const handleDownload = (content: string | Blob, filename: string) => {
    const url = (content instanceof Blob) ? URL.createObjectURL(content) : content;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (content instanceof Blob) {
      URL.revokeObjectURL(url);
    }
  };
  
  const handleDownloadZip = async () => {
    if (!videoPackage) return;
    
    const zip = new JSZip();
    const imageFolder = zip.folder("frames");
    if (!imageFolder) return;

    const imageFetchPromises = videoPackage.imageUrls.map(async (url, index) => {
        if (!url) return;
        try {
            const response = await fetch(url);
            imageFolder.file(`frame-${index + 1}.png`, await response.blob());
        } catch (e) { console.error(`Failed to fetch image ${index + 1}:`, e); }
    });

    await Promise.all(imageFetchPromises);
    zip.file("script.txt", videoPackage.script);
    if (videoPackage.audioDataUri) {
      const audioBlob = await (await fetch(videoPackage.audioDataUri)).blob();
      zip.file("narration.wav", audioBlob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const cleanTitle = videoPackage!.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    handleDownload(content, `${cleanTitle}_assets.zip`);
  }

  const handleExport = async (format: ExportFormat) => {
    if (!isOnline && format !== 'zip') {
      toast({ title: "You are offline", description: `Exporting to ${format.toUpperCase()} requires an internet connection to load libraries.`, variant: "destructive" });
      return;
    }
    if (isExporting) {
        toast({ title: 'An export is already in progress.', variant: 'destructive' });
        return;
    }
    if (!debit('DoN', EXPORT_DON_FEE, `Video Export Fee (${format.toUpperCase()})`)) {
      return;
    }

    const checks = {
      images: ['mp4', 'gif'],
      audio: ['mp4', 'wav', 'mp3', 'aac']
    }

    if (checks.images.includes(format) && videoPackage?.imageUrls.some(url => url === null)) {
      toast({ title: "Missing Images", description: "Cannot export without all storyboard frames.", variant: "destructive" });
      return;
    }
    if (checks.audio.includes(format) && !videoPackage?.audioDataUri) {
      toast({ title: "Missing Audio", description: "Cannot export this format without audio.", variant: "destructive" });
      return;
    }

    setIsExporting(format);
    toast({ title: `Preparing your ${format.toUpperCase()} file...`, description: "This may take a moment." });

    const ffmpeg = ffmpegRef.current;

    try {
        if (format === 'zip') {
            await handleDownloadZip();
            toast({ title: 'Assets zip file created successfully!' });
            return;
        }
        if (format === 'wav') {
            handleDownload(videoPackage!.audioDataUri!, `${videoPackage!.title}_narration.wav`);
            toast({ title: 'WAV audio downloaded.' });
            return;
        }

        // All other formats need FFMPEG
        if (!ffmpeg.loaded) {
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
        }

        // Write input files
        if (checks.images.includes(format)) {
            const validImages = videoPackage!.imageUrls.filter((url): url is string => url !== null);
            for (let i = 0; i < validImages.length; i++) {
                await ffmpeg.writeFile(`frame-${i + 1}.png`, await fetchFile(validImages[i]));
            }
        }
        if (checks.audio.includes(format)) {
            await ffmpeg.writeFile('narration.wav', await fetchFile(videoPackage!.audioDataUri!));
        }

        let command: string[];
        let outputFilename: string;
        let mimeType: string;

        switch (format) {
            case 'mp4':
                outputFilename = 'output.mp4';
                mimeType = 'video/mp4';
                command = [
                  '-framerate', `1/${frameDuration}`, '-i', 'frame-%d.png',
                  '-i', 'narration.wav',
                  '-c:v', 'libx264', '-r', '30', '-pix_fmt', 'yuv420p',
                  '-c:a', 'aac', '-shortest',
                  outputFilename
                ];
                break;
            case 'gif':
                outputFilename = 'output.gif';
                mimeType = 'image/gif';
                command = [
                  '-framerate', `1/${frameDuration}`, '-i', 'frame-%d.png',
                  '-vf', 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
                  outputFilename
                ];
                break;
            case 'mp3':
                outputFilename = 'output.mp3';
                mimeType = 'audio/mpeg';
                command = ['-i', 'narration.wav', '-c:a', 'libmp3lame', '-q:a', '2', outputFilename];
                break;
            case 'aac':
                outputFilename = 'output.aac';
                mimeType = 'audio/aac';
                command = ['-i', 'narration.wav', '-c:a', 'aac', '-b:a', '192k', outputFilename];
                break;
            default:
                throw new Error('Unsupported export format');
        }
        
        await ffmpeg.exec(command);
        const data = await ffmpeg.readFile(outputFilename);
        const blob = new Blob([(data as Uint8Array).buffer], { type: mimeType });
        
        const cleanTitle = videoPackage!.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        handleDownload(blob, `${cleanTitle}.${format}`);
        toast({ title: `${format.toUpperCase()} file generated and downloaded!` });

    } catch (error) {
        console.error(`Export failed for ${format}:`, error);
        toast({ title: `Export Failed`, description: `Could not create ${format.toUpperCase()} file. See console for details.`, variant: 'destructive' });
    } finally {
        setIsExporting(null);
    }
};


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const timeUpdate = () => setAudioProgress((audio.currentTime / audio.duration) * 100);
    const onEnded = () => { setIsPlaying(false); setAudioProgress(0); };
    audio.addEventListener("timeupdate", timeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", timeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [videoPackage?.audioDataUri]);

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

  const showResults = isAnythingLoading || videoPackage;

  return (
    <DashboardLayout>
        <PageHeader title="Composition Studio" description="Combine images, audio, and text to create a video composition."/>
        <div className="space-y-8">
            <form onSubmit={handleGenerateVideo} className="space-y-4">
                <Textarea placeholder="e.g., A cinematic shot of a lone astronaut discovering a glowing alien artifact..." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[100px] text-base" disabled={isAnythingLoading || !isOnline} />
                <Button type="submit" disabled={isAnythingLoading || !isOnline} className="w-full sm:w-auto">
                    {isAnythingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                    {isGeneratingConcept ? 'Directing...' : isGeneratingImages ? 'Rendering...' : isGeneratingAudio ? 'Recording...' : `Generate Storyboard`}
                </Button>
            </form>

            {showResults && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                             <CardHeader><CardTitle>{videoPackage?.title || <Skeleton className="h-8 w-3/4" />}</CardTitle></CardHeader>
                            <CardContent>
                                <Carousel 
                                  className="w-full max-w-full" 
                                  opts={{ loop: true }}
                                  setApi={setCarouselApi}
                                >
                                    <CarouselContent>
                                        {(videoPackage?.imageUrls && videoPackage.imageUrls.some(url => url !== null))
                                            ? videoPackage.imageUrls.map((url, index) => (
                                                <CarouselItem key={index}><div className="p-1"><div className="aspect-video relative bg-muted rounded-lg flex items-center justify-center">
                                                    {url ? <Image src={url} alt={`frame ${index + 1}`} fill className="object-contain rounded-lg" data-ai-hint="video frame" />
                                                        : (isGeneratingImages && <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><span>Generating Frame {index + 1}...</span></div>)}
                                                </div></div></CarouselItem>
                                            )) : Array.from({ length: 4 }).map((_, index) => (
                                                <CarouselItem key={index}><div className="p-1"><div className="aspect-video relative bg-muted rounded-lg flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">{isGeneratingConcept ? <Wand2 className="h-8 w-8 animate-pulse" /> : <Loader2 className="h-8 w-8 animate-spin" />}<span>{isGeneratingConcept ? 'Awaiting prompt...' : `Generating Frame ${index + 1}...`}</span></div>
                                                </div></div></CarouselItem>
                                            ))
                                        }
                                    </CarouselContent>
                                    <CarouselPrevious className="hidden sm:flex" /><CarouselNext className="hidden sm:flex" />
                                </Carousel>
                                {imageError && <div className="text-destructive text-sm mt-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {imageError}</div>}
                            </CardContent>
                        </Card>
                        {videoPackage &&
                        <Card>
                             <CardHeader><CardTitle>Script & Narration</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <ScrollArea className="h-48 rounded-md border p-4 bg-muted/50"><p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{videoPackage.script}</p></ScrollArea>
                                <div className="bg-muted rounded-lg p-4 min-h-[72px] flex items-center justify-center">
                                    {isGeneratingAudio ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /><p>Recording voiceover...</p></div>
                                     : audioError ? <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-6 w-6" /><p>{audioError}</p></div>
                                     : videoPackage.audioDataUri ? <div className="w-full flex items-center gap-4"><audio ref={audioRef} src={videoPackage.audioDataUri} className="hidden" /><Button size="icon" onClick={togglePlayPause}>{isPlaying ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}</Button><Progress value={audioProgress} className="w-full" /></div>
                                     : null}
                                </div>
                            </CardContent>
                        </Card>
                        }
                    </div>

                     <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-6 w-6" /> Export Options</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                               <div className="space-y-2">
                                  <Label htmlFor="frame-duration">Frame Duration: {frameDuration}s</Label>
                                  <Slider
                                    id="frame-duration"
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[frameDuration]}
                                    onValueChange={(value) => setFrameDuration(value[0])}
                                    disabled={isAnythingLoading || !!isExporting || !videoPackage || !isOnline}
                                  />
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => handleExport('mp4')}
                                        disabled={isAnythingLoading || !!isExporting || !videoPackage || !isOnline}
                                    >
                                        {isExporting === 'mp4' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileVideo2 className="mr-2 h-4 w-4" />}
                                        {isExporting === 'mp4' ? 'Exporting MP4...' : `Export Video (MP4) (${EXPORT_DON_FEE} DoN)`}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="w-full" variant="outline" disabled={isAnythingLoading || !!isExporting || !videoPackage || !isOnline}>
                                                {(isExporting && isExporting !== 'mp4' && isExporting !== 'zip') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                                                {(isExporting && isExporting !== 'mp4' && isExporting !== 'zip') ? `Exporting ${isExporting.toUpperCase()}...` : 'More Export Options'}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56">
                                            <DropdownMenuLabel>Video (Cost: ${EXPORT_DON_FEE} DoN)</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleExport('gif')} disabled={!!isExporting}>
                                                <FileImage className="mr-2 h-4 w-4" />
                                                <span>GIF (silent)</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Audio Only (Cost: ${EXPORT_DON_FEE} DoN)</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleExport('wav')} disabled={!!isExporting}>
                                                <FileAudio2 className="mr-2 h-4 w-4" />
                                                WAV (Original)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('mp3')} disabled={!!isExporting}>
                                                <FileAudio2 className="mr-2 h-4 w-4" />
                                                MP3
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport('aac')} disabled={!!isExporting}>
                                                <FileAudio2 className="mr-2 h-4 w-4" />
                                                AAC
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleExport('zip')} disabled={!!isExporting}>
                                                <Package className="mr-2 h-4 w-4" />
                                                <span>Download All Assets (.zip)</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">Exports are processed in your browser and may be slow on some devices.</p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    </DashboardLayout>
  );
}
