import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LeafletMap from "@/components/LeafletMap";
import { useEffect, useState } from "react";

const App = () => {

  const [showGrid, setShowGrid] = useState(false)
  return (
    <SidebarProvider>
      <AppSidebar setShowGrid = {setShowGrid} />
      <div style={{ display: "flex", height: "100vh", margin: 0, zIndex: 0 }}>
        <LeafletMap showGrid = {showGrid}/>
      </div>
    </SidebarProvider>
  );
};

export default App;