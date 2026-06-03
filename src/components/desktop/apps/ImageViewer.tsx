
"use client";

import { Creation } from "@/context/CreationsContext";
import Image from 'next/image';
import { useState, useEffect } from "react";

export const ImageViewer = ({ creation }: { creation: Creation }) => {
    const [imageUrl, setImageUrl] = useState<string>('');

    useEffect(() => {
        let objectUrl: string | null = null;

        if (creation.data?.imageUrl) {
            setImageUrl(creation.data.imageUrl);
        } else if (creation.data instanceof Blob) {
            objectUrl = URL.createObjectURL(creation.data);
            setImageUrl(objectUrl);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [creation]);


    if (!imageUrl) {
        return <div className="p-4">Cannot display this image.</div>
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-muted p-2">
            <div className="relative w-full h-full">
                <Image 
                    src={imageUrl} 
                    alt={creation.title} 
                    fill 
                    className="object-contain"
                />
            </div>
        </div>
    );
};
