import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export function useSidebarAutoClose() {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  // Sempre chama o hook - se não estiver no contexto, será undefined
  const sidebarContext = useSidebar();

  useEffect(() => {
    // Fecha o sidebar mobile automaticamente quando a rota muda
    if (prevPathnameRef.current !== pathname) {
      if (sidebarContext?.isMobile && sidebarContext?.setOpenMobile) {
        sidebarContext.setOpenMobile(false);
      }
      prevPathnameRef.current = pathname;
    }
  }, [pathname, sidebarContext?.isMobile, sidebarContext?.setOpenMobile]);
}
