
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getFriendlyAIError } from '@/lib/utils';
import { bugHunter, BugHunterInput, BugHunterOutput } from '@/ai/flows/bug-hunter-flow';
import { Loader2, Bug, Code, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const exampleBugReport = JSON.stringify([
    {
        "bug_id": "BUG-001",
        "description": "User can bypass payment wall by manipulating client-side state in localStorage.",
        "severity": "critical",
        "affected_component": "PaymentModal",
        "steps_to_reproduce": "1. Open payment modal. 2. Open browser dev tools. 3. Set `localStorage.setItem('hasPaid', 'true')`. 4. Refresh page. 5. Premium content is unlocked."
    }
], null, 2);

const exampleCodeSnippet = `// PaymentModal.tsx
import { useState, useEffect } from 'react';

function PaymentModal() {
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // This is insecure! Client-side checks are not enough.
    const hasPaid = localStorage.getItem('hasPaid');
    if (hasPaid === 'true') {
      setIsPaid(true);
    }
  }, []);

  if (isPaid) {
    return <div>Thank you for your payment!</div>;
  }
  
  // ... payment form logic
}`;

export function BugHunter() {
    const { toast } = useToast();
    const isOnline = useOnlineStatus();
    const [model, setModel] = useState('googleai/gemini-1.5-flash-latest');

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BugHunterOutput | null>(null);
    const [formState, setFormState] = useState<Partial<BugHunterInput>>({
        scopeAndPurpose: "Web application security audit",
        language: "JavaScript/TypeScript",
        bugReports: [],
        codeSnippets: []
    });
    const [bugReportText, setBugReportText] = useState(exampleBugReport);
    const [codeSnippetText, setCodeSnippetText] = useState(exampleCodeSnippet);
    
    useEffect(() => {
        const storedModel = localStorage.getItem('infinite-universe-model');
        if (storedModel) {
            setModel(storedModel);
        }
    }, []);

    const handleSubmit = async () => {
        if (!isOnline) {
            toast({ title: "You are offline.", variant: "destructive" });
            return;
        }

        let parsedBugReports;
        try {
            parsedBugReports = JSON.parse(bugReportText);
            if (!Array.isArray(parsedBugReports)) throw new Error("Bug reports must be a JSON array.");
        } catch (e: any) {
            toast({ title: "Invalid Bug Report JSON", description: e.message, variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setResult(null);

        const input: BugHunterInput = {
            scopeAndPurpose: formState.scopeAndPurpose || 'General code review',
            language: formState.language || 'Code',
            bugReports: parsedBugReports,
            codeSnippets: codeSnippetText.split('---'), // Split by separator
            model,
        };

        try {
            const res = await bugHunter(input);
            setResult(res);
        } catch (error) {
            toast({ title: "Bug Hunter Failed", description: getFriendlyAIError(error), variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const getSeverityBadge = (severity: 'critical' | 'major' | 'minor' | 'trivial') => {
        switch(severity) {
            case 'critical': return 'bg-red-500 text-white';
            case 'major': return 'bg-orange-500 text-white';
            case 'minor': return 'bg-yellow-500 text-black';
            case 'trivial': return 'bg-blue-500 text-white';
        }
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel: Input */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Submit for Analysis</CardTitle>
                        <CardDescription>Provide context, bug reports, and code snippets for the Bug Hunter AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="scope">Scope & Purpose</Label>
                            <Input id="scope" value={formState.scopeAndPurpose} onChange={e => setFormState(s => ({...s, scopeAndPurpose: e.target.value}))} placeholder="e.g., Web application security audit" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Input id="language" value={formState.language} onChange={e => setFormState(s => ({...s, language: e.target.value}))} placeholder="e.g., JavaScript/TypeScript" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bug-reports">Bug Reports (JSON Array)</Label>
                            <Textarea id="bug-reports" value={bugReportText} onChange={e => setBugReportText(e.target.value)} className="font-mono text-xs min-h-[200px]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code-snippets">Code Snippets (use '---' to separate files)</Label>
                            <Textarea id="code-snippets" value={codeSnippetText} onChange={e => setCodeSnippetText(e.target.value)} className="font-mono text-xs min-h-[200px]" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSubmit} disabled={isLoading || !isOnline} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
                            Run Bug Hunter
                        </Button>
                    </CardFooter>
                </Card>

                {/* Right Panel: Output */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Bug Hunter Report</CardTitle>
                        <CardDescription>The AI's analysis and improvement plan will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                <span>Analyzing code and reports...</span>
                            </div>
                        )}
                        {result && (
                            <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Summary</h3>
                                        <p className="text-sm text-muted-foreground">{result.summary}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Prioritized Findings</h3>
                                        <div className="space-y-3">
                                            {result.prioritized_findings.map((finding, i) => (
                                                <Card key={i} className="p-3">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-semibold text-base">{finding.title}</h4>
                                                        <Badge className={cn("ml-2", getSeverityBadge(finding.evaluation.severity))}>
                                                            Priority: {finding.priority}/10
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{finding.type}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Bug Fixes</h3>
                                        <div className="space-y-3">
                                            {result.bug_fixes.map((fix, i) => (
                                                <Card key={i} className="p-3">
                                                    <h4 className="font-semibold text-base">Fix for Finding ID: {fix.finding_id}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">{fix.suggested_fix}</p>
                                                    {fix.code_snippet && (
                                                        <pre className="mt-2 bg-slate-800 text-white p-2 rounded-md font-mono text-xs overflow-x-auto">
                                                            <code>{fix.code_snippet}</code>
                                                        </pre>
                                                    )}
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">System Improvements</h3>
                                        <div className="space-y-3">
                                            {result.system_improvements.map((imp, i) => (
                                                <Card key={i} className="p-3">
                                                    <h4 className="font-semibold text-base">{imp.title}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">{imp.suggestion}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
}
