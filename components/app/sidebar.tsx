'use client';

import {
  Book,
  BookCheck,
  CalendarDays,
  ChessQueen,
  CircleUser,
  LibraryBig,
  LogOut,
  MessageCircle,
} from 'lucide-react';
import {
  Sidebar as RawSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
  SidebarMenuItem,
  SidebarMenuButton,
} from '../ui/sidebar';
import Typography from '../ui/typography';
import { ThemeToggler } from './theme-toggler';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Divider } from './divider';
import { usePathname } from 'next/navigation';

export const Sidebar = () => {
  const { open } = useSidebar();
  const { data: session } = useSession();
  const activePath = usePathname();
  return (
    <RawSidebar>
      <img
        src='/chrysanthemum.png'
        alt=''
        role='presentation'
        className='pointer-events-none absolute rotate-[340deg] bottom-[-5px] right-[-20px] -z-10 w-44 select-none opacity-[0.06] brightness-0 invert'
      />
      <img
        src='/chrysanthemum.png'
        alt=''
        role='presentation'
        className='pointer-events-none absolute -scale-x-100 rotate-[30deg] bottom-[150px] left-[-10] bottom-[200px] -z-10 w-44 select-none opacity-[0.06] brightness-0 invert'
      />
      <SidebarHeader className='p-4'>
        <Typography
          variant='h1'
          classNames='font-sidebar-foreground text-[68px]/[.9] pl-12 -indent-12 !mb-0'
        >
          Smut Society
        </Typography>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className='pt-0'>
          <Divider />
          <Link href='/book'>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activePath.includes('book')}>
                <Book />
                Home
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
          <Link href='/events'>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activePath.includes('events')}>
                <CalendarDays />
                Events
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
          <Link href='/reviews'>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activePath.includes('review')}>
                <MessageCircle />
                Reviews
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
          <Divider />
          <Link href='/library'>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activePath.includes('library')}>
                <LibraryBig />
                Library
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
          <Link href='/past-reads'>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activePath.includes('past-reads')}>
                <BookCheck />
                Past Reads
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
          <Link href='/challenges'>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activePath.includes('challenges')}>
                <ChessQueen />
                Challenges
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarGroup>
        <SidebarGroup className='mt-auto'></SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='items-center'>
        {session ? (
          <div className='flex flex-col items-center gap-sm pb-sm'>
            <div className='relative flex size-20 items-center justify-center'>
              <img
                src='/avatar-frame.png'
                alt=''
                role='presentation'
                className='pointer-events-none absolute inset-0 size-full object-contain brightness-0 invert sepia'
              />
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? 'User avatar'}
                  className='size-10 rounded-full object-cover'
                />
              ) : (
                <CircleUser className='size-10' />
              )}
            </div>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => signOut()}
                className='justify-center'
              >
                <LogOut />
                Log out
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signIn('google')}>
              <CircleUser />
              Log in
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        <ThemeToggler />
      </SidebarFooter>
    </RawSidebar>
  );
};
