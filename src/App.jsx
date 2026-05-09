import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import DashboardHome from './components/dashboard/DashboardHome';

function App() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard/*" element={<DashboardHome />} />
      </Routes>
    </motion.div>
  );
}

export default App;
