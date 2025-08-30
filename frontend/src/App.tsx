import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LeafletMap from "@/components/LeafletMap";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar"

const App = () => {

  const [showGrid, setShowGrid] = useState(true)
  const [cellSize, setCellSize] = useState(0.5)
  const [toDate, setToDate] = useState<Date | undefined>(new Date())
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Get the date from 90 days ago
  return (
    <SidebarProvider>
      <AppSidebar
        setShowGrid={setShowGrid}
        showGrid = {showGrid}
        setCellSize={setCellSize}
        cellSize={cellSize}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
      />
      <SidebarTrigger className="z-10 bg-white rounded-tl-none rounded-bl-none" />
      <LeafletMap className="absolute inset-0 z-0" showGrid={showGrid} cellSize={cellSize} fromDate={fromDate} toDate={toDate} />
    </SidebarProvider>
  );
};

export default App;