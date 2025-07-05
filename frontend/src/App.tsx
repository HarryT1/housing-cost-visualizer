import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LeafletMap from "@/components/LeafletMap";
import { useEffect, useState } from "react";

const App = () => {

  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("http://localhost:5000/helloworld")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <div style={{zIndex:100}}>{data ? data.message : ""} test</div>
      <div style={{ display: "flex", height: "100vh", margin: 0, zIndex: 0 }}>
        <LeafletMap />
      </div>
    </SidebarProvider>
  );
};

export default App;