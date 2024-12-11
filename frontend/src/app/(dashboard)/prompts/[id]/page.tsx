// src/app/(dashboard)/prompts/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { NewsCard, NewsCardSkeleton } from "@/components/news/NewsCard";
import { News, UpdateFrequency, frequencyMap } from "@/types/news";
import { Newspaper, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Prompt {
 id: number;
 name: string;
 content: string;
 user_id: number;
 created_at: string;
 updated_at: string;
}

export default function PromptPage() {
 const params = useParams();
 const promptId = params.id;
 const [prompt, setPrompt] = useState<Prompt | null>(null);
 const [news, setNews] = useState<News[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isNewsLoading, setIsNewsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [activeFilter, setActiveFilter] = useState("30 minutes");
 const filters = ["All News", "30 minutes", "Hourly", "Daily"];

 const fetchNews = async () => {
   setIsNewsLoading(true);
   try {
     const token = document.cookie
       .split('; ')
       .find(row => row.startsWith('token='))
       ?.split('=')[1];

     if (!token) {
       throw new Error('No authentication token found');
     }

     // Convert filter to API frequency format
     const frequency = frequencyMap[activeFilter as keyof typeof frequencyMap];
     
     // Use the news endpoint with query parameters
     const url = new URL('http://localhost:8000/api/v1/news/');
     url.searchParams.append('prompt_id', promptId as string);
     if (frequency) {
       url.searchParams.append('frequency', frequency);
     }
     url.searchParams.append('skip', '0');
     url.searchParams.append('limit', '100');

     const response = await fetch(url.toString(), {
       headers: {
         'Authorization': `Bearer ${token}`,
         'accept': 'application/json',
       },
     });

     if (!response.ok) {
       throw new Error('Failed to fetch news');
     }

     const data = await response.json();
     // Sort news by created_at in descending order
     const sortedNews = data.sort((a: News, b: News) => 
       new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
     );
     setNews(sortedNews);
   } catch (err) {
     console.error('Error fetching news:', err);
     setNews([]);
   } finally {
     setIsNewsLoading(false);
   }
 };

 // Fetch prompt details
 useEffect(() => {
   const fetchPrompt = async () => {
     try {
       const token = document.cookie
         .split('; ')
         .find(row => row.startsWith('token='))
         ?.split('=')[1];

       if (!token) {
         throw new Error('No authentication token found');
       }

       const response = await fetch(`http://localhost:8000/api/v1/prompts/${promptId}`, {
         headers: {
           'Authorization': `Bearer ${token}`,
           'accept': 'application/json',
         },
       });

       if (!response.ok) {
         throw new Error('Failed to fetch prompt details');
       }

       const data = await response.json();
       setPrompt(data);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to fetch prompt details');
       console.error('Error fetching prompt:', err);
     } finally {
       setIsLoading(false);
     }
   };

   if (promptId) {
     fetchPrompt();
   }
 }, [promptId]);

 // Fetch news based on prompt and filter
 useEffect(() => {
   if (promptId && !isLoading && !error) {
     fetchNews();
   }
 }, [promptId, activeFilter, isLoading, error]);

 if (isLoading) {
   return (
     <div className="p-6">
       <div className="h-6 w-48 bg-muted animate-pulse rounded mb-8"></div>
       <div className="flex gap-3 mt-6">
         {filters.map((_, i) => (
           <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md"></div>
         ))}
       </div>
       <div className="space-y-4 mt-8">
         <NewsCardSkeleton />
         <NewsCardSkeleton />
       </div>
     </div>
   );
 }

 if (error) {
   return (
     <div className="p-6">
       <div className="text-destructive">Error: {error}</div>
     </div>
   );
 }

 return (
   <div className="p-6">
     {/* Header Section */}
     <div className="flex justify-between items-start mb-8">
       <div className="flex-1">
         <h2 className="text-xl text-foreground/90 font-medium flex items-center gap-2">
           <Newspaper className="h-5 w-5 text-foreground/50" />
           {prompt?.name}
         </h2>
         
         {/* Time Filter Buttons */}
         <div className="flex gap-3 mt-6">
           {filters.map((filter) => (
             <button
               key={filter}
               onClick={() => setActiveFilter(filter)}
               className={`px-4 py-2 rounded-md text-sm transition-all ${
                 activeFilter === filter 
                 ? 'bg-primary text-white shadow-sm' 
                 : 'bg-background hover:bg-muted text-foreground/70'
               }`}
             >
               {filter}
             </button>
           ))}
         </div>
       </div>
       
       <Button
         variant="outline"
         size="icon"
         onClick={fetchNews}
         disabled={isNewsLoading}
         className="h-9 w-9"
       >
         <RefreshCcw className="h-4 w-4" />
       </Button>
     </div>

     {/* News Feed */}
     <div className="space-y-4">
       {isNewsLoading ? (
         <>
           <NewsCardSkeleton />
           <NewsCardSkeleton />
         </>
       ) : news.length === 0 ? (
         <div className="text-center text-muted-foreground py-8">
           No news available for this filter
         </div>
       ) : (
         news.map((item) => (
           <NewsCard key={item.id} news={item} />
         ))
       )}
     </div>
   </div>
 );
}