import {
  CalendarRange,
  MapPinned,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Slider } from "@/components/ui/slider";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import React, { useState } from "react";

import { Calendar28 } from "@/components/date-picker";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

type AppSidebarProps = {
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  showGrid: boolean;
  setCellSize: React.Dispatch<React.SetStateAction<number>>;
  cellSize: number;
  fromDate: Date | undefined;
  setFromDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  toDate: Date | undefined;
  setToDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
};

export function AppSidebar({
  setShowGrid,
  showGrid,
  setCellSize,
  cellSize,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
}: AppSidebarProps) {
  const isMobile = useIsMobile();
  const [tempCellSize, setTempCellSize] = useState<number>(cellSize);

  const [confirmSignal, setConfirmSignal] = useState(0);

  const handleConfirm = () => {
    setConfirmSignal((prev) => prev + 1);
  };

  return (
    <Sidebar>
      <SidebarHeader>Inställningar</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <CalendarRange />
                      <span>{`Ändra tidsperiod`}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side={isMobile ? "bottom" : "right"}>
                    <div className="px-2 py-1.5 z-10">
                      <Calendar28
                        title="Från"
                        initialDate={fromDate}
                        setConfirmDate={setFromDate}
                        confirmSignal={confirmSignal}
                      />
                    </div>
                    <div className="px-2 py-1.5 z-10">
                      <Calendar28
                        title="Till"
                        initialDate={toDate}
                        setConfirmDate={setToDate}
                        confirmSignal={confirmSignal}
                      />
                    </div>
                    <DropdownMenuItem>
                      <Button
                        className="w-full"
                        onClick={() => handleConfirm()}
                      >
                        Välj
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <span className = "block w-full text-center">{`${
                  !fromDate ? "" : fromDate.toLocaleDateString("sv-SE", { day: "2-digit", month: "2-digit", year: "numeric" })
                } - ${
                  !toDate ? "" : toDate.toLocaleDateString("sv-SE", { day: "2-digit", month: "2-digit", year: "numeric" })
                }`}</span>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowGrid((prev) => !prev)}>
                  <MapPinned />
                  <span>
                    {showGrid
                      ? "Ändra till kommunvy"
                      : "Ändra till rutnätsvy"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {showGrid && (
                <SidebarMenuItem><span className = "block w-full text-center">
                  Rutstorlek: {tempCellSize} x {tempCellSize} km<sup>2</sup> </span>
                  <SidebarMenuButton>
                    <Slider
                      defaultValue={[cellSize * 10]}
                      max={20}
                      min={1}
                      step={1}
                      onValueChange={(val) => setTempCellSize(val[0] / 10)}
                      onValueCommit={() => setCellSize(tempCellSize)}
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
