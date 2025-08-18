'use client';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { capitalizeFirstLetter } from '@/helps/captalizeFristLetter';
import DatePicker from './date-picker';
import { ModeToggle } from './mode-toggle-theme';

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="flex h-(--header-height) shrink-0 fix items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">
          {capitalizeFirstLetter(pathname.split('/').pop() || '')}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <DatePicker />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
