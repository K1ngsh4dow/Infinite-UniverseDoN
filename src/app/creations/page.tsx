
"use client";

import Image from "next/image";
import { useCreations, Creation } from "@/context/CreationsContext";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Play, Film, BookOpen, Mic, Music, Palette, LayoutGrid } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

const CreationCard = ({ creation }: { creation: Creation }) => {
  
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

  const renderContent = () => {
    switch (creation.type) {
      case 'image':
      case 'file':
        const imageUrl = creation.data.imageUrl || creation.data.url;
        return (
            <div className="aspect-video relative">
                <Image src={imageUrl} alt={creation.title} fill className="object-cover rounded-t-lg" data-ai-hint="generated image"/>
                 <Button variant="secondary" size="icon" className="absolute top-2 right-2" onClick={() => handleDownload(imageUrl, `${creation.title}.png`)}>
                    <Download className="h-4 w-4" />
                </Button>
            </div>
        );
      case 'music':
        return (
            <div className="aspect-video relative">
                <Image src={creation.data.imageUrl} alt={creation.title} fill className="object-cover rounded-t-lg" data-ai-hint="album cover"/>
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white/80" />
                 </div>
            </div>
        );
      case 'story':
         return (
            <div className="aspect-video relative bg-muted rounded-t-lg">
                {creation.data.imageUrl ? 
                    <Image src={creation.data.imageUrl} alt={creation.title} fill className="object-cover" data-ai-hint="story illustration"/>
                    : <div className="flex items-center justify-center h-full"><BookOpen className="h-10 w-10 text-muted-foreground" /></div>
                }
            </div>
        );
      case 'video':
        return (
           <div className="aspect-video relative bg-muted rounded-t-lg overflow-hidden">
             <Carousel className="w-full h-full" opts={{ loop: true }}>
              <CarouselContent>
                  {creation.data.imageUrls.map((url: string, index: number) => (
                      <CarouselItem key={index}>
                          <div className="relative w-full h-full aspect-video">
                              <Image src={url} alt={`Frame ${index + 1}`} fill className="object-contain" />
                          </div>
                      </CarouselItem>
                  ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
             </Carousel>
           </div>
        )
      case 'speech':
        return (
            <div className="aspect-video flex items-center justify-center bg-muted rounded-t-lg">
                <Play className="h-12 w-12 text-muted-foreground" />
            </div>
        );
      default:
        return (
             <div className="aspect-video flex items-center justify-center bg-muted rounded-t-lg">
                <Palette className="h-10 w-10 text-muted-foreground" />
            </div>
        );
    }
  }

  const getIcon = () => {
     switch (creation.type) {
      case 'image': return <Palette className="mr-2 h-4 w-4" />;
      case 'music': return <Music className="mr-2 h-4 w-4" />;
      case 'story': return <BookOpen className="mr-2 h-4 w-4" />;
      case 'video': return <Film className="mr-2 h-4 w-4" />;
      case 'speech': return <Mic className="mr-2 h-4 w-4" />;
      case 'file': return <Palette className="mr-2 h-4 w-4" />;
      default: return <Palette className="mr-2 h-4 w-4" />;
    }
  }

  return (
    <Card>
      <CardHeader className="p-0">
        {renderContent()}
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg truncate">{creation.title}</CardTitle>
        <CardDescription className="mt-1 text-sm h-10 overflow-hidden text-ellipsis">
          Prompt: {creation.prompt}
        </CardDescription>
        <div className="flex justify-between items-center mt-4">
            <div className="flex items-center text-xs text-muted-foreground">
                {getIcon()}
                <span className="capitalize">{creation.type}</span>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(creation.timestamp).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}


export default function CreationsPage() {
  const { creations, isLoaded } = useCreations();

  // Filter out items from the History folder and any folders themselves
  const displayCreations = creations.filter(c => c.path !== '/History/' && c.type !== 'folder');


  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
                <CardHeader className="p-0">
                    <Skeleton className="w-full aspect-video rounded-t-lg" />
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
            </Card>
        ))}
    </div>
  )

  return (
    <DashboardLayout>
      <PageHeader
        title="My Creations"
        description="A gallery of your generated media. This is stored in your browser and will persist between sessions."
      />
      {!isLoaded ? renderSkeletons() : displayCreations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCreations.map((item) => (
            <CreationCard key={item.id} creation={item} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-12 h-80">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Creations Yet</h3>
            <p className="text-muted-foreground mt-2">Start creating images, stories, music, and more to see them here.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
