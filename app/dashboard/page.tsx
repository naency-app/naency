"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import UsersList from "@/components/users-list"
import ProfileTest from "@/components/profile-test"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import staticData from "./data.json"
import { authClient } from "@/lib/auth-client"
import { useEffect, useState } from "react"

export default function Page() {

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">

          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={staticData} />

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
      </SidebarInset>
    </SidebarProvider>
  )
}
