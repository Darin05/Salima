import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/sonner';
import Home from '@/pages/Home';
import SkinQuiz from '@/pages/SkinQuiz';
import QuizResult from '@/pages/QuizResult';
import Services from '@/pages/Services';
import Booking from '@/pages/Booking';
import About from '@/pages/About';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import '@/App.css';

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz" element={<SkinQuiz />} />
            <Route path="/quiz-result/:id" element={<QuizResult />} />
            <Route path="/services" element={<Services />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
          <WhatsAppFloat />
          <Toaster position="top-center" />
        </BrowserRouter>
      </div>
    </LanguageProvider>
  );
}

export default App;
