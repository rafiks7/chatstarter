"use client";


import { RedirectToSignIn } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import {DashboardSidebar} from "./_components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Authenticated>
        <SidebarProvider>
          <DashboardSidebar />
          {children}
        </SidebarProvider>
      </Authenticated>
      <Unauthenticated>{<RedirectToSignIn />}</Unauthenticated>
    </>
  );
}
