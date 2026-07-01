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
  SidebarDivider,
} from '../ui/sidebar';
import Typography from '../ui/typography';
import { ThemeToggler } from './theme-toggler';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export const Sidebar = () => {
  const { open } = useSidebar();
  const { data: session } = useSession();

  return (
    <RawSidebar>
      <div className='flex justify-between items-center p-sm'>
        <SidebarTrigger />
        {open && <ThemeToggler />}
      </div>
      {open && (
        <>
          <SidebarHeader className='p-4'>
            <Typography
              variant='h1'
              classNames='font-sidebar-foreground text-[68px]/[.9] pl-12 -indent-12 !mb-0'
            >
              Smut Society
            </Typography>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarDivider />
              <Link href='/book'>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Book />
                    Home
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
              <Link href='/events'>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <CalendarDays />
                    Events
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
              <Link href='/reviews'>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <MessageCircle />
                    Reviews
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
              <SidebarDivider />
              <Link href='/library'>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <LibraryBig />
                    Library
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
              <Link href='/past-reads'>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <BookCheck />
                    Past Reads
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
              <Link href='/challenges'>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <ChessQueen />
                    Challenges
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
            </SidebarGroup>
            <SidebarGroup className='mt-auto'>
              <SidebarMenuItem>
                {session ? (
                  <SidebarMenuButton onClick={() => signOut()}>
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? 'User avatar'}
                        className='size-5 rounded-full object-cover'
                      />
                    ) : (
                      <CircleUser />
                    )}
                    Log out
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton onClick={() => signIn('google')}>
                    <CircleUser />
                    Log in
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter></SidebarFooter>
        </>
      )}
      {!open && (
        <SidebarContent>
          <SidebarGroup>
            <Link href='/book'>
              <SidebarMenuButton>
                <Book />
              </SidebarMenuButton>
            </Link>
            <Link href='/events'>
              <SidebarMenuButton>
                <CalendarDays />
              </SidebarMenuButton>
            </Link>
            <Link href='/reviews'>
              <SidebarMenuButton>
                <MessageCircle />
              </SidebarMenuButton>
            </Link>
          </SidebarGroup>
          <SidebarGroup>
            <Link href='/library'>
              <SidebarMenuButton>
                <LibraryBig />
              </SidebarMenuButton>
            </Link>
            <Link href='/past-reads'>
              <SidebarMenuButton>
                <BookCheck />
              </SidebarMenuButton>
            </Link>
            <Link href='/challenges'>
              <SidebarMenuButton>
                <ChessQueen />
              </SidebarMenuButton>
            </Link>
          </SidebarGroup>
          <SidebarGroup className='mt-auto'>
            {session ? (
              <SidebarMenuButton onClick={() => signOut()}>
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? 'User avatar'}
                    className='size-5 rounded-full object-cover'
                  />
                ) : (
                  <LogOut />
                )}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton onClick={() => signIn('google')}>
                <CircleUser />
              </SidebarMenuButton>
            )}
          </SidebarGroup>
        </SidebarContent>
      )}
    </RawSidebar>
  );
};
