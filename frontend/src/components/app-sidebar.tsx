import { CalendarRange, MapPinned, SlidersHorizontal, Plus, Minus } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar"

import { Slider } from "@/components/ui/slider"

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

import React, { useState } from "react";

import { Calendar28 } from "@/components/date-picker";
import { Button } from "./ui/button";
import { filterProperties } from "@turf/turf"
import { useIsMobile } from "@/hooks/use-mobile"

type AppSidebarProps = {
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  showGrid: boolean;
  setCellSize: React.Dispatch<React.SetStateAction<number>>;
  cellSize: number;

}

export function AppSidebar({ setShowGrid, showGrid, setCellSize, cellSize }: AppSidebarProps) {
  const isMobile = useIsMobile();
  const [toDate, setToDate] = useState<Date | undefined>(new Date())
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Get the date from 90 days ago
  const [tempCellSize, setTempCellSize] = useState<number>(cellSize);
  return (
    <Sidebar>
      <SidebarHeader>Inställningar</SidebarHeader>
      <SidebarContent>

        <SidebarGroup>
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
                  <DropdownMenuContent side={isMobile ? "bottom" : "right"}>
                    <div className="px-2 py-1.5 z-10">
                      <Calendar28 title="Från" date={fromDate} setDate={setFromDate} />
                    </div>
                    <div className="px-2 py-1.5 z-10">
                      <Calendar28 title="Till" date={toDate} setDate={setToDate} />
                    </div>
                    <DropdownMenuItem><Button className="w-full">Välj</Button></DropdownMenuItem>


                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowGrid(prev => !prev)}>
                  <MapPinned />
                  <span>{showGrid ? "Ändra till kommunvy" : "Ändra till rutnätsvy"}</span>
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
                  <DropdownMenuContent side={isMobile ? "bottom" : "right"}>
                    <DropdownMenuLabel>Filterinställningar</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Test</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
              {showGrid && (
                <SidebarMenuItem>
                  Rutstorlek: {tempCellSize} x {tempCellSize} km<sup>2</sup>
                  <SidebarMenuButton>
                    <Slider defaultValue={[cellSize * 10]} max={20} min={1} step={1} onValueChange={val => setTempCellSize(val[0] / 10)} onValueCommit={() => setCellSize(tempCellSize)} />
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}