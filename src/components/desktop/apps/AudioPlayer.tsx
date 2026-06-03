
"use client";

import { Creation } from "@/context/CreationsContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const AudioPlayer = ({ creation }: { creation: Creation }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const getAudioSrc = () => {
        if (creation.data?.audioDataUri) {
            return creation.data.audioDataUri;
        }
        if (creation.data instanceof Blob) {
            return URL.createObjectURL(creation.data);
        }
        return '';
    };

    const audioSrc = getAudioSrc();

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onTimeUpdate = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
        const onEnded = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            if (audioSrc.startsWith('blob:')) {
                URL.revokeObjectURL(audioSrc);
            }
        };
    }, [audioSrc]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (!audioSrc) {
        return <div className="p-4">Cannot play this audio file.</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 gap-6 bg-card">
            <h3 className="font-semibold text-xl text-center">{creation.title}</h3>
            <div className="w-full max-w-xs flex items-center gap-4">
                <audio ref={audioRef} src={audioSrc} className="hidden" />
                <Button size="icon" onClick={togglePlay}>
                    {isPlaying ? <Pause /> : <Play />}
                </Button>
                <Progress value={progress} />
            </div>
        </div>
    );
};
