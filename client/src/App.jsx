import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { ChatRoom } from './pages/ChatRoom';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter',sans-serif]">
          <Routes>
            {/* Pages with standard navbar */}
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <Home />
                </>
              }
            />
            <Route
              path="/create"
              element={
                <>
                  <Navbar />
                  <CreateRoom />
                </>
              }
            />
            <Route
              path="/join"
              element={
                <>
                  <Navbar />
                  <JoinRoom />
                </>
              }
            />

            {/* Chat room has its own custom full-screen header and layout */}
            <Route path="/room/:roomId" element={<ChatRoom />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
