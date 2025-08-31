import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

export function useSidebarAutoClose() {
  const pathname = usePathname();
  
  // Verifica se o hook está disponível (dentro do contexto do SidebarProvider)
  try {
    const { isMobile, setOpenMobile } = useSidebar();

    useEffect(() => {
      // Fecha o sidebar mobile automaticamente quando a rota muda
      if (isMobile && setOpenMobile) {
        setOpenMobile(false);
      }
    }, [pathname, isMobile, setOpenMobile]);
  } catch {
    // Se o hook não estiver disponível (fora do contexto), não faz nada
    // Isso pode acontecer durante SSR ou se o componente não estiver dentro do SidebarProvider
  }
}
