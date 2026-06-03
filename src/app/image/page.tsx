
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Download, Palette } from "lucide-react";
import { generateImage, GenerateImageOutput } from "@/ai/flows/generate-image";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreations } from "@/context/CreationsContext";
import { getFriendlyAIError } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSpark } from "@/context/SparkContext";

const STORAGE_KEY = 'iu-image-generation-state';
// const SPARK_FEE = 1;

export default function ImageGenerationPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('googleai/gemini-1.5-flash-latest');
  const [imageResult, setImageResult] = useState<GenerateImageOutput | null>(null);
  const { toast } = useToast();
  const { addCreation } = useCreations();
  const isOnline = useOnlineStatus();
  const { spendSpark } = useSpark();

  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const { prompt, imageResult } = JSON.parse(savedState);
        setPrompt(prompt || "");
        setImageResult(imageResult || null);
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

  useEffect(() => {
    try {
      const stateToSave = JSON.stringify({ prompt, imageResult });
      sessionStorage.setItem(STORAGE_KEY, stateToSave);
    } catch (error) {
      console.error('Failed to save state to session storage:', error);
    }
  }, [prompt, imageResult]);

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ title: "You are offline", description: "Please check your connection.", variant: "destructive" });
      return;
    }
    if (!prompt) {
      toast({
        title: "Prompt is required",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }
    
    // if (!spendSpark(SPARK_FEE)) return;

    setIsLoading(true);
    setImageResult(null);
    
    try {
      const result = await generateImage({ prompt, model });
      setImageResult(result);
      await addCreation({
        type: 'image',
        title: `Image: ${prompt.substring(0, 25)}...`,
        prompt,
        path: '/',
        data: { imageUrl: result.imageUrl },
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error Generating Image",
        description: getFriendlyAIError(error),
        variant: "destructive",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (imageResult?.imageUrl) {
      const link = document.createElement('a');
      link.href = imageResult.imageUrl;
      link.download = `infinite-universe-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="AI Image Generation"
        description="Generate stunning images from your text prompts using AI."
      />
      <div className="space-y-8">
        <form onSubmit={handleGenerateImage} className="space-y-4">
          <Textarea
            placeholder={isOnline ? "e.g., A majestic lion wearing a crown, photorealistic." : "Image generation is unavailable offline."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] text-base"
            disabled={isLoading || !isOnline}
          />
          <Button type="submit" disabled={isLoading || !isOnline}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Palette className="mr-2 h-4 w-4" /> }
              { isLoading ? 'Generating...' : `Generate Image` }
          </Button>
        </form>

        {(isLoading || imageResult) && (
          <Card>
            <CardHeader>
               <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="aspect-square relative bg-muted rounded-lg">
                    {isLoading ? (
                         <div className="flex flex-col gap-4 items-center justify-center h-full">
                            <Skeleton className="h-full w-full" />
                        </div>
                    ) : (
                        imageResult?.imageUrl &&
                        <Image
                            src={imageResult.imageUrl}
                            alt={prompt}
                            fill
                            className="object-contain rounded-lg"
                            data-ai-hint="generated image"
                        />
                    )}
                </div>
            </CardContent>
            {imageResult?.imageUrl && !isLoading && (
                 <CardFooter>
                    <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Image
                    </Button>
                </CardFooter>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
