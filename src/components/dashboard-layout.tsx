
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Image,
  AudioLines,
  Music,
  Video,
  LayoutGrid,
  User,
  LogOut,
  BookText,
  Settings,
  MessageCircle,
  Shield,
  Bot,
  LayoutDashboard,
  Mountain,
  Crown,
  Sparkles,
  CandlestickChart,
  Share2,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import FloatingChatIcon from "@/components/floating-chat-icon";
import { useChatWidget } from "@/context/ChatWidgetContext";
import { ChatWidget } from "@/components/chat-widget";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallet } from "@/context/WalletContext";
import { useSpark } from "@/context/SparkContext";
import { Skeleton } from "./ui/skeleton";


const navItems = [
  { href: "/desktop", label: "Desktop", icon: LayoutDashboard },
  { href: "/vault", label: "Vault", icon: Shield },
  { href: "/secure-share", label: "Secure Share", icon: Share2 },
  { href: "/creations", label: "Creations", icon: LayoutGrid },
  { href: "/image", label: "Image", icon: Image },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/story", label: "Story", icon: BookText },
  { href: "/speech", label: "Speech", icon: AudioLines },
  { href: "/music", label: "Music", icon: Music },
  { href: "/video", label: "Composition Studio", icon: Video },
  { href: "/copilots", label: "Copilots", icon: Bot },
  { href: "/terraformer", label: "Terraformer", icon: Mountain },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toggleChat } = useChatWidget();
  const isDesktopPage = pathname === '/desktop';
  const { address } = useWallet();
  const { sparkBalance, isLoaded: isSparkLoaded } = useSpark();
  
  const OWNER_ADDRESS = 'don_addr_40cf623cf3b68d029228d20474e7e9514a11a980133a8125';
  const isOwner = address === OWNER_ADDRESS;
  
  const userName = isOwner ? "Owner" : "User";
  const userEmail = isOwner ? "master@infinite.universe" : "user@email.com";
  const userAvatarFallback = isOwner ? "O" : "U";


  const handleChatClick = () => {
    if (isMobile) {
      router.push('/chat');
    } else {
      toggleChat();
    }
  };


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
             <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="h-6 w-6"
              >
                <rect width="256" height="256" fill="none" />
                <path
                  d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="16"
                />
                <path
                  d="M168,100h0a40,40,0,0,1-80,0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="16"
                />
              </svg>
            <span className="font-headline text-lg font-semibold">Infinite Universe</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              if (item.href === '/chat') {
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      onClick={handleChatClick}
                      className="justify-start"
                      tooltip={item.label}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="justify-start"
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <div className="p-2 group-data-[collapsible=icon]:p-0">
            {isSparkLoaded ? (
              <Button variant="ghost" className="justify-start gap-2 w-full p-2 h-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:mx-auto" asChild>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  <span className="text-left group-data-[collapsible=icon]:hidden">
                      <p className="font-medium">{sparkBalance.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">SPARK</p>
                  </span>
                </div>
              </Button>
            ) : (
              <Skeleton className="h-10 w-full" />
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start gap-2 w-full p-2 h-auto">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="@user" data-ai-hint="person user" />
                  <AvatarFallback>{userAvatarFallback}</AvatarFallback>
                </Avatar>
                <span className="text-left group-data-[collapsible=icon]:hidden">
                    <p className="font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 md:hidden">
          <SidebarTrigger />
          <Link href="/" className="flex items-center gap-2">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="h-6 w-6"
              >
                <rect width="256" height="256" fill="none" />
                <path
                  d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="16"
                />
                <path
                  d="M168,100h0a40,40,0,0,1-80,0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="16"
                />
              </svg>
            <span className="font-headline text-lg font-semibold">Infinite Universe</span>
          </Link>
          <Button asChild variant="ghost" size="icon">
            <Link href="/settings">
                <Settings />
            </Link>
          </Button>
        </header>
        <main className={cn(
          "h-[calc(100vh-4rem)] md:h-screen overflow-auto",
          isDesktopPage ? "p-0" : "p-4 md:p-8"
        )}>
          {children}
        </main>
      </SidebarInset>
      {!isMobile && <ChatWidget />}
      <FloatingChatIcon />
    </SidebarProvider>
  );
}
