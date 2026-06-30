'use client';

import {
  Book,
  BookCheck,
  CalendarDays,
  ChessQueen,
  LibraryBig,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sidebar as RawSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarDivider,
} from '../ui/sidebar';
import Typography from '../ui/typography';
import { ThemeToggler } from './theme-toggler';
import Link from 'next/link';

export const Sidebar = () => {
  const { open } = useSidebar();

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
              classNames='font-sidebar-foreground text-[68px]/[.9] pl-12 -indent-12'
            >
              Smut Society
            </Typography>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarDivider />
              <Link href='/home'>
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
              <Link href='/games'>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <ChessQueen />
                    Challenges
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter></SidebarFooter>
        </>
      )}
      {!open && (
        <SidebarContent>
          <SidebarGroup>
            <Link href='/home'>
              <SidebarMenuButton>
                <Book />
              </SidebarMenuButton>
            </Link>
            <Link href='/events'>
              <SidebarMenuButton>
                <CalendarDays />
              </SidebarMenuButton>
            </Link>
            <Link href='reviews'>
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
            <Link href='past-reads'>
              <SidebarMenuButton>
                <BookCheck />
              </SidebarMenuButton>
            </Link>
            <Link href='games'>
              <SidebarMenuButton>
                <ChessQueen />
              </SidebarMenuButton>
            </Link>
          </SidebarGroup>
        </SidebarContent>
      )}
    </RawSidebar>
  );
};
