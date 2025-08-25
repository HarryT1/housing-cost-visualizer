import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LeafletMap from "@/components/LeafletMap";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar"

const App = () => {

  const [showGrid, setShowGrid] = useState(true)
  const [cellSize, setCellSize] = useState(0.5)
  return (
    <SidebarProvider>

      <AppSidebar
        setShowGrid={setShowGrid}
        showGrid = {showGrid}
        setCellSize={setCellSize}
        cellSize={cellSize}
      />
      <SidebarTrigger className="z-10 bg-white" />
      <LeafletMap className="absolute inset-0 z-0" showGrid={showGrid} cellSize={cellSize} />
    </SidebarProvider>
  );
};

export default App;