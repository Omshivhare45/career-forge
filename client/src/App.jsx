import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';
import GlobalLoader from './components/GlobalLoader';

// Layout
const Layout = lazy(() => import('./components/Layout'));

// Pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const TopicDetail = lazy(() => import('./pages/TopicDetail'));
const Assessments = lazy(() => import('./pages/Assessments'));
const AiChat = lazy(() => import('./pages/AiChat'));
const Resources = lazy(() => import('./pages/Resources'));
const CareerGuide = lazy(() => import('./pages/CareerGuide'));
const ZeroToCoding = lazy(() => import('./pages/ZeroToCoding'));
const Ide = lazy(() => import('./pages/Ide'));
const Profile = lazy(() => import('./pages/Profile'));
const Feedback = lazy(() => import('./pages/Feedback'));
const About = lazy(() => import('./pages/About'));
const Careers = lazy(() => import('./pages/Careers'));
const Jobs = lazy(() => import('./pages/Jobs'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Contact = lazy(() => import('./pages/Contact'));

// Guest Pages
const GuestExploreRoadmap = lazy(() =>
  import('./pipelines/guestExplore/GuestExploreRoadmap')
);

const GuestLearningMaterial = lazy(() =>
  import('./pipelines/guestExplore/GuestLearningMaterial')
);

// Academics
const AcademicsHome = lazy(() => import('./pages/AcademicsHome'));
const AcademicsSubjects = lazy(() => import('./pages/AcademicsSubjects'));
const AcademicsSubjectDetail = lazy(() => import('./pages/AcademicsSubjectDetail'));
const AcademicsChapterDetail = lazy(() => import('./pages/AcademicsChapterDetail'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageProblems = lazy(() => import('./pages/admin/ManageProblems'));
const CreateProblem = lazy(() => import('./pages/admin/CreateProblem'));
const EditProblem = lazy(() => import('./pages/admin/EditProblem'));
const ManageSubmissions = lazy(() => import('./pages/admin/ManageSubmissions'));
const ManageTestCases = lazy(() => import('./pages/admin/ManageTestCases'));
const ManageTopics = lazy(() => import('./pages/admin/ManageTopics'));
const ManageAcademics = lazy(() => import('./pages/admin/ManageAcademics'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'premium-toast',
            style: {
              background: '#ffffff',
              color: '#101828',
              border: '1px solid #eaecf0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(16, 24, 40, 0.1)',
            },
          }}
        />

        <InstallPrompt />

        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<Contact />} />

            {/* Guest Routes */}
            <Route
              path="/explore/roadmap/:domainSlug"
              element={<GuestExploreRoadmap />}
            />
            <Route
              path="/explore/lesson/:topicId"
              element={<GuestLearningMaterial />}
            />

            <Route element={<Layout />}>
              {/* Public Learning Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/domains" element={<Dashboard />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/topic/:id" element={<TopicDetail />} />
              <Route path="/ide" element={<Ide />} />

              {/* Academics */}
              <Route path="/academics" element={<AcademicsHome />} />
              <Route
                path="/academics/subjects/:semesterId/:branchId"
                element={<AcademicsSubjects />}
              />
              <Route
                path="/academics/subject/:subjectId"
                element={<AcademicsSubjectDetail />}
              />
              <Route
                path="/academics/chapter/:chapterId"
                element={<AcademicsChapterDetail />}
              />

              {/* Protected Student Routes */}
              <Route
                element={<ProtectedRoute allowedRoles={['student', 'admin']} />}
              >
                <Route path="/setup-profile" element={<Onboarding />} />
                <Route path="/assessments" element={<Assessments />} />
                <Route path="/code-guru" element={<AiChat />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/career-guide" element={<CareerGuide />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/zero-to-coding" element={<ZeroToCoding />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/feedback" element={<Feedback />} />
              </Route>

              {/* Admin Routes */}
              <Route
                element={<ProtectedRoute allowedRoles={['admin']} />}
              >
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminDashboard />} />
                <Route path="/admin/problems" element={<ManageProblems />} />
                <Route path="/admin/problems/create" element={<CreateProblem />} />
                <Route path="/admin/problems/edit/:id" element={<EditProblem />} />
                <Route
                  path="/admin/problems/test-cases/:id"
                  element={<ManageTestCases />}
                />
                <Route path="/admin/submissions" element={<ManageSubmissions />} />
                <Route path="/admin/topics" element={<ManageTopics />} />
                <Route path="/admin/academics" element={<ManageAcademics />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;