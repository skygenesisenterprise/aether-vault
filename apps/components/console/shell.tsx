"use client";

import * as React from "react";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ConsoleSidebar } from "./sidebar";
import { ConsoleHeader } from "./header";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ConsoleSidebar />
      <SidebarInset>
        <ConsoleHeader />
        <main className="flex flex-1 flex-col gap-6 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
