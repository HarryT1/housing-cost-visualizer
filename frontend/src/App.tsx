import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LeafletMap from "@/components/LeafletMap";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar"

const App = () => {

  const [showGrid, setShowGrid] = useState(true)
  return (
    <SidebarProvider>
      <AppSidebar setShowGrid={setShowGrid} />
      <div className="relative z-10">
        <SidebarTrigger />
      </div>
      <LeafletMap className="absolute inset-0 z-0" showGrid={showGrid} />
    </SidebarProvider>
  );
};

export default App;