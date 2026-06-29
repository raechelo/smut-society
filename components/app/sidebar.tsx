'use client';

import React, { useState } from 'react';
import {
  Sidebar as RawSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '../ui/sidebar';
import Typography from '../ui/typography';

export const Sidebar = () => {
  const { open } = useSidebar();

  return (
    <RawSidebar>
      <SidebarTrigger />
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
            <SidebarGroup />
            <SidebarGroup />
          </SidebarContent>
          <SidebarFooter />
        </>
      )}
    </RawSidebar>
  );
};
