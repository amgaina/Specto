import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Login
import Login from "./pages/Login";

// Manager Pages
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerDataExplorer from "./pages/manager/DataExplorer";
import ManagerImageAnalysis from "./pages/manager/ImageAnalysis";
import ManagerSettings from "./pages/manager/Settings";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminReview from "./pages/admin/Review";
import AdminUpload from "./pages/admin/Upload";
import AdminImages from "./pages/admin/Images";
import AdminMapView from "./pages/admin/MapView";
import AdminSettings from "./pages/admin/Settings";

// Public/Citizen Scientist Pages
import PublicDashboard from "./pages/public/Dashboard";
import PublicUpload from "./pages/public/Upload";
import PublicAchievements from "./pages/public/Achievements";
import PublicVolunteer from "./pages/public/Volunteer";
import PublicSettings from "./pages/public/Settings";
import ManagerMapView from "./pages/manager/MapView";
import DataExplorer from "./pages/admin/DataExplorer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Wildlife Manager Routes */}
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/data" element={<ManagerDataExplorer />} />
          <Route path="/manager/analysis" element={<ManagerImageAnalysis />} />
          <Route path="/manager/depth" element={<ManagerMapView />} />
          <Route path="/manager/settings" element={<ManagerSettings />} />

          {/* Data Administrator Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/review" element={<AdminReview />} />
          <Route path="/admin/upload" element={<AdminUpload />} />
          <Route path="/admin/images" element={<AdminImages />} />
          <Route path="/admin/map" element={<AdminMapView />} />
          <Route path="/admin/data" element={<DataExplorer />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* Public/Citizen Scientist Routes */}
          <Route path="/public" element={<PublicDashboard />} />
          <Route path="/public/upload" element={<PublicUpload />} />
          <Route path="/public/achievements" element={<PublicAchievements />} />
          <Route path="/public/volunteer" element={<PublicVolunteer />} />
          <Route path="/public/settings" element={<PublicSettings />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
