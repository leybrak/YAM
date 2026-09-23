import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { PairingPage } from "./pages/PairingPage";
import { AlbumPage } from "./pages/AlbumPage";
import { EntryDetailPage } from "./pages/EntryDetailPage";
import { CapsulesPage } from "./pages/CapsulesPage";
import { SummaryPage } from "./pages/SummaryPage";
import { ProtectedRoute, RequireCouple } from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
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
