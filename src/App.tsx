import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { CollegeDetailPage } from './pages/CollegeDetailPage'
import { CollegeLoginPage } from './pages/CollegeLoginPage'
import { CollegesPage } from './pages/CollegesPage'
import { CoursesPage } from './pages/CoursesPage'
import { IndexPage } from './pages/IndexPage'
import { ListCollegePage } from './pages/ListCollegePage'
import { ProgramCollegesPage } from './pages/ProgramCollegesPage'
import { PrintsCatalogPage } from './pages/PrintsCatalogPage'
import { PrintsDashboardPage } from './pages/PrintsDashboardPage'
import { PrintsHistoryPage } from './pages/PrintsHistoryPage'
import { PrintsPaymentReturnPage } from './pages/PrintsPaymentReturnPage'
import { PrintsViewPage } from './pages/PrintsViewPage'
import { StreamProgramsPage } from './pages/StreamProgramsPage'
import { StudentLoginPage } from './pages/StudentLoginPage'
import { TakeAdmissionPage } from './pages/TakeAdmissionPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/colleges" element={<CollegesPage />} />
        <Route path="/colleges/:collegeSlug" element={<CollegeDetailPage />} />
        <Route path="/colleges/:collegeSlug/apply" element={<TakeAdmissionPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:streamSlug" element={<StreamProgramsPage />} />
        <Route path="/courses/:streamSlug/:programSlug" element={<ProgramCollegesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/prints" element={<PrintsCatalogPage />} />
        <Route path="/prints/dashboard" element={<PrintsDashboardPage />} />
        <Route path="/prints/history" element={<PrintsHistoryPage />} />
        <Route path="/prints/view/:purchaseId" element={<PrintsViewPage />} />
        <Route path="/prints/payment/return" element={<PrintsPaymentReturnPage />} />
        <Route path="/login" element={<StudentLoginPage />} />
        <Route path="/register" element={<StudentLoginPage />} />
        <Route path="/college/login" element={<CollegeLoginPage />} />
        <Route path="/college/register" element={<ListCollegePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
