'use client';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import ProfileTest from '@/components/profile-test';
import { SectionCards } from '@/components/section-cards';
import UsersList from '@/components/users-list';
import staticData from './data.json';

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>


          {/* Componentes de teste da API */}
          <div className="px-4 lg:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <UsersList />
              <ProfileTest />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
