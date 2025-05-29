import { MainLayout } from "@/components/main-layout";
import { DiscussSidebar } from "@/components/discuss/DiscussSidebar";

export default function DiscussLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <div className="flex h-full min-h-screen">
        <aside className="w-72 border-r bg-white dark:bg-gray-900">
          <DiscussSidebar />
        </aside>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </MainLayout>
  );
} 