import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenuButton,
    SidebarProvider,
    SidebarMenu,
    SidebarGroupLabel,
    SidebarGroupAction,
    SidebarFooter,
    SidebarMenuItem,
  } from "@/components/ui/sidebar";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { useQuery } from "convex/react";
  import { Sidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { PlusIcon, User2Icon } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { SignOutButton } from "@clerk/nextjs";

export function DashboardSidebar() {
    const user = useQuery(api.functions.user.get);
  
    if (!user) {
      return null;
    }
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuButton asChild>
                  <Link href="/friends">
                    <User2Icon />
                    Friends
                  </Link>
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarGroupContent>
            <SidebarGroup>
              <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
              <SidebarGroupAction>
                <PlusIcon />
                <span className="sr-only">New Direct Message</span>
              </SidebarGroupAction>
            </SidebarGroup>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton className="flex items-center">
                        <Avatar className="size-6">
                          <AvatarImage src={user.image} />
                          <AvatarFallback>
                            {user.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{user.username}</p>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <SignOutButton />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    );
  }
  