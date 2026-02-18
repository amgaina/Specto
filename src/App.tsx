import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PipelineProvider } from "./context/PipelineContext";
import NotFound from "./pages/NotFound";

// Login
import Login from "./pages/Login";

// Manager Pages
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerDataExplorer from "./pages/manager/DataExplorer";
import ManagerImageAnalysis from "./pages/manager/ImageAnalysis";
import ManagerSettings from "./pages/manager/Settings";
import ManagerMapView from "./pages/manager/MapView";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPipeline from "./pages/admin/Pipeline";
import AdminMapView from "./pages/admin/MapView";
import AdminSettings from "./pages/admin/Settings";
import DataExplorer from "./pages/admin/DataExplorer";

// Public/Citizen Scientist Pages
import PublicDashboard from "./pages/public/Dashboard";
import PublicUpload from "./pages/public/Upload";
import PublicProgress from "./pages/public/Progress";
import PublicSettings from "./pages/public/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PipelineProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Wildlife Manager Routes */}
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/data" element={<ManagerDataExplorer />} />
          <Route path="/manager/analysis" element={<ManagerImageAnalysis />} />
          <Route path="/manager/map" element={<ManagerMapView />} />
          <Route path="/manager/settings" element={<ManagerSettings />} />
          <Route path="/manager/depth" element={<Navigate to="/manager/map" replace />} />

          {/* Data Administrator Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pipeline" element={<AdminPipeline />} />
          <Route path="/admin/map" element={<AdminMapView />} />
          <Route path="/admin/data" element={<DataExplorer />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/upload" element={<Navigate to="/admin/pipeline" replace />} />
          <Route path="/admin/images" element={<Navigate to="/admin/pipeline" replace />} />
          <Route path="/admin/review" element={<Navigate to="/admin/pipeline" replace />} />

          {/* Public/Citizen Scientist Routes */}
          <Route path="/public" element={<PublicDashboard />} />
          <Route path="/public/upload" element={<PublicUpload />} />
          <Route path="/public/progress" element={<PublicProgress />} />
          <Route path="/public/settings" element={<PublicSettings />} />
          <Route path="/public/achievements" element={<Navigate to="/public/progress" replace />} />
          <Route path="/public/volunteer" element={<Navigate to="/public/progress" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </PipelineProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
