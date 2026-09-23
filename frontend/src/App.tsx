import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { PairingPage } from "./pages/PairingPage";
import { AlbumPage } from "./pages/AlbumPage";
import { EntryDetailPage } from "./pages/EntryDetailPage";
import { CapsulesPage } from "./pages/CapsulesPage";
import { SummaryPage } from "./pages/SummaryPage";
import { ProtectedRoute, RequireCouple } from "./components/ProtectedRoute";

/** Lets the service worker route a tapped push notification through the
 * SPA's own router instead of a hard page reload. */
function ServiceWorkerNavigation() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "navigate" && event.data.url) navigate(event.data.url);
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ServiceWorkerNavigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/vinculo" element={<PairingPage />} />
          <Route element={<RequireCouple />}>
            <Route path="/album" element={<AlbumPage />} />
            <Route path="/album/:entryId" element={<EntryDetailPage />} />
            <Route path="/capsulas" element={<CapsulesPage />} />
            <Route path="/resumen" element={<SummaryPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
