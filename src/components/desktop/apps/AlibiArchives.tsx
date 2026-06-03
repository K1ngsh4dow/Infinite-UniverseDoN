
'use client';

import React from 'react';
import { AlibiSetupScreen } from './alibi-archives/AlibiSetupScreen';


export function AlibiArchives() {
    // The logic for generating a mystery has been moved to the AI tool.
    // This component is now a simple entry point that directs the user to use the AI Assistant.
    return <AlibiSetupScreen onGenerate={() => {}} isLoading={false} />;
}
