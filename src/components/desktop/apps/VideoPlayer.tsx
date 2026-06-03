
"use client";

import { Creation } from "@/context/CreationsContext";
import { useState, useEffect } from "react";

export const VideoPlayer = ({ creation }: { creation: Creation }) => {
    const [videoSrc, setVideoSrc] = useState<string>('');

    useEffect(() => {
        let objectUrl: string | null = null;
        if (creation.data instanceof Blob) {
            objectUrl = URL.createObjectURL(creation.data);
            setVideoSrc(objectUrl);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [creation]);


    if (!videoSrc) {
        return <div className="p-4">Cannot play this video file.</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-black">
            <video 
                src={videoSrc}
                controls
                autoPlay
                className="w-full h-full object-contain"
            />
        </div>
    );
};
