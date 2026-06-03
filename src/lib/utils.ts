import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFriendlyAIError(error: any): string {
  const errorMessage = String(error?.message || error || "An unexpected error occurred.");

  if (errorMessage.includes("429") || /quota/i.test(errorMessage)) {
    return "You have exceeded your API quota for the day. Please try again tomorrow.";
  }
  
  if (errorMessage.includes("API key not valid")) {
    return "The provided API key is not valid. Please check your settings.";
  }

  if (/safety/i.test(errorMessage)) {
     return "The request was blocked due to safety settings. Please modify your prompt and try again.";
  }

  // A more generic error for other cases.
  return "An unexpected error occurred. Please check your network connection and API settings.";
}
