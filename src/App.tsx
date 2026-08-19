import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/pitchme/Layout";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import Companies from "@/pages/Companies";
import CompanyDetail from "@/pages/CompanyDetail";
import PitchDetail from "@/pages/PitchDetail";
import Submit from "@/pages/Submit";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";
import { Terms, Privacy, CommunityGuidelines, CopyrightTrademark } from "@/pages/Legal";

// The console is never linked publicly and is not needed by normal visitors.
const Admin = lazy(() => import("@/pages/Admin"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<div className="shell py-20" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/company/:slug" element={<CompanyDetail />} />
            <Route
              path="/pitch/:companySlug/:productSlug/:pitchSlug"
              element={<PitchDetail />}
            />
            <Route path="/submit" element={<Submit />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/copyright-trademark" element={<CopyrightTrademark />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
      <Toaster />
    </BrowserRouter>
  );
}
