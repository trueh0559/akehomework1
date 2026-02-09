import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import GlobalBackground from "@/components/ui/GlobalBackground";
import Index from "./pages/Index";
import SurveyPage from "./pages/SurveyPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import AdminSettings from "./pages/AdminSettings";
import AdminSurveys from "./pages/AdminSurveys";
import AdminSurveyEditor from "./pages/AdminSurveyEditor";
import AdminChats from "./pages/AdminChats";
import AdminCoupons from "./pages/AdminCoupons";
import MyCoupons from "./pages/MyCoupons";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <GlobalBackground />
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/survey/:id" element={<SurveyPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/surveys" element={<AdminSurveys />} />
              <Route path="/admin/surveys/:id/edit" element={<AdminSurveyEditor />} />
              <Route path="/admin/chats" element={<AdminChats />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/my-coupons" element={<MyCoupons />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
