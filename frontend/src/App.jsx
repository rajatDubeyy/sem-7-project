import { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/login'
import Register from './pages/register'
import Home from './pages/home'
import EyeDetectionTimer from './components/EyeMonitor'
import Game from './pages/game1'
import PokemonBattle from "./brawl/PokemonBattle.jsx";
import Journal from './components/Journal';
import TherapistList from './components/TherapistList';
import GamesHub from './pages/Games.jsx'
import CosmicDefender from './components/CosmicDefender.jsx';
import TherapistAppointments from './components/TherapistAppointments';
import PatientFiles from './components/PatientFiles.jsx'
import FocusForestTimer from './components/FocusForestTimer.jsx'
import MedicalReportAnalyzer from './components/DiseaseDetection.jsx'
import MeditationHome from './pages/MediHome.jsx'
import RedeemStore from './components/Store.jsx'
import CombinedStorePage from './pages/CombinedStorePage.jsx'
import { HabitBlockchainProvider } from './context/HabitBlockchainContext.jsx';
import IPFSUploader from './components/IPFSUploader.jsx';
import UserDashboard from './components/UserDashBoard.jsx'
import TherapistVolunteerGenerator from './components/Prescription.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <HabitBlockchainProvider>
   
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/" element={<Home />}></Route>
        <Route path="/meditate" element={<EyeDetectionTimer />}></Route>
        <Route path="/fruit" element={<Game />}></Route>
        <Route path="/pokemon" element={<PokemonBattle />}></Route>
        <Route path="/therapist" element={<TherapistList />}></Route>
        <Route path="/games" element={<GamesHub />}></Route>
        <Route path="/journal" element={ <Journal user={user} />} />
          <Route path="/forest" element={<FocusForestTimer />}></Route>
          <Route path="/cosmic" element={<CosmicDefender />}></Route>
        <Route path="/appointments" element={<TherapistAppointments />} />
        <Route path="/patient-files" element={<PatientFiles />} />  
          <Route path="/crisis" element={<MedicalReportAnalyzer />}></Route>
        <Route path="/meditation" element={<MeditationHome />}></Route>
        <Route path='/redeem' element={<CombinedStorePage />}></Route>
        <Route path='/upload' element={<IPFSUploader />}></Route>
        <Route path="/usedash" element={<UserDashboard />} ></Route>
        <Route path="/generator" element={<TherapistVolunteerGenerator />}></Route>
      </Routes>
    </BrowserRouter>
    </HabitBlockchainProvider>
  )
}

export default App
