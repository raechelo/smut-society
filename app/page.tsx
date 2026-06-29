import { Sidebar } from '@/components/app/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Home() {
  return (
    <div className=''>
      <SidebarProvider>
        <main className='w-full h-[100vh]'>
          <Sidebar />
        </main>
      </SidebarProvider>
    </div>
  );
}
