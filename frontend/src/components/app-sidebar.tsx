import { CalendarRange, MapPinned, SlidersHorizontal } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator

} from "@/components/ui/dropdown-menu"

import { Calendar } from "@/components/ui/calendar"

import { useState } from "react";

import { Calendar28 } from "@/components/date-picker";
import { Button } from "./ui/button";


export function AppSidebar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  return (
    <Sidebar collapsible="none">
      <SidebarContent>
        
        <SidebarGroup>
          <SidebarGroupLabel>Välj inställningar</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <DropdownMenu >
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <SlidersHorizontal />
                      <span>Tidsperiod</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right">
                    <div className = "px-2 py-1.5">
                      {/* Get the date from 90 days ago */}
                      <Calendar28 title="Från" displayDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}/>
                    </div>
                    <div className = "px-2 py-1.5">
                      <Calendar28 title="Till" displayDate={new Date()}/>
                    </div>
                    <DropdownMenuItem><Button>Välj</Button></DropdownMenuItem>


                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MapPinned />
                  <span>Geografisk uppdelning</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <DropdownMenu >
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <SlidersHorizontal />
                      <span>Filter</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right">
                    <DropdownMenuLabel>Choose filter settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Test</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}