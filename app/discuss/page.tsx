"use client";
import { DiscussSidebar } from "@/components/discuss/DiscussSidebar";

export default function DiscussPage() {
  return (
    <div className="flex h-full min-h-screen">
      <aside className="w-72 border-r bg-white dark:bg-gray-900">
        <DiscussSidebar />
      </aside>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Select a channel to start chatting</div>
      </main>
    </div>
  );
} 