import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import IndexPage from './pages/IndexPage';
import PrintLabelPage from './pages/PrintLabelPage';
import UploadPage from './pages/UploadPage';
import PrintRecordsPage from './pages/PrintRecordsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<IndexPage />} />
                  <Route path="/print" element={<PrintLabelPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/records" element={<PrintRecordsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
