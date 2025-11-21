import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import NavBar from './components/NavBar'
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  const [user, setUser] = useState(null);

  // Fetch current session user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/me", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.err("User not logged in");
      }
    };

    fetchUser();
  }, []);

  return (
    <Router>
      <div className="flex flex-col h-screen w-screen">
        <NavBar user={user} setUser={setUser}/>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setUser={setUser}/>} />
            <Route path="/register" element={<Register />} />
            <Route path="/admindash" element={<AdminDashboard user={user} setUser={setUser}/>} />
            <Route path="/teacherdash" element={<TeacherDashboard user={user} setUser={setUser}/>} />
            <Route path="/studentdash" element={<StudentDashboard user={user} setUser={setUser}/>} />
            {/* Add other routes like Dashboard, Attendance, etc. */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App
