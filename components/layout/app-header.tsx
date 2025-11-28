"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-4 px-6 py-4">
        <SidebarTrigger />
        <div className="flex-1">
          <h2 className="text-xl">Clinic Management System</h2>
          <p className="text-sm text-muted-foreground">Welcome back, Dr. Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <p className="text-sm">Dr. Sarah Williams</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            SW
          </div>
        </div>
      </div>
    </header>
  )
}
