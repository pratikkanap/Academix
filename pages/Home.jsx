import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-emerald-50 text-black px-4 text-center h-[80vh]" style={{
        backgroundImage: "url('/images/ams.jpg')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        // backgroundColor: "rgba(0, 0, 0, 0.2)",
      }}>
        <div className="h-100 w-full flex flex-col align-center justify-center" style={{
          backgroundColor: "rgba(0,0,0,0.2)",
        }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Attendance & Performance </h1>
          <p className="text-lg md:text-xl mb-6">Efficiently manage students, attendance, and performance all in one place.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-gray-600 w-fit mx-auto font-semibold px-8 py-2 rounded-full shadow hover:bg-gray-100 transition"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-gray-50 text-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
            <img
              src="/images/5024147.jpg" // replace with your actual image path
              alt="Student Management"
              className="w-full h-80 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2 text-center">Student Management</h3>
            <p className="text-center">Add, update, and manage student records with ease.</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
            <img
              src="/images/3564883.jpg" // replace with your actual image path
              alt="Student Management"
              className="w-full h-80 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Attendance Tracking</h3>
            <p>Track attendance by subject and view summary reports.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
            <img
              src="/images/4892463.jpg" // replace with your actual image path
              alt="Student Management"
              className="w-full h-80 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Performance Monitoring</h3>
            <p>Record test scores and identify students who need improvement.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
            <img
              src="/images/6185779.jpg" // replace with your actual image path
              alt="Student Management"
              className="w-full h-80 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Overall Performance</h3>
            <p>Track Overall Performance Per Division</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
            <img
              src="/images/649.jpg" // replace with your actual image path
              alt="Student Management"
              className="w-full h-80 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Top Performers / Leaderboard</h3>
            <p>Track attendance by subject and view summary reports.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
            <img
              src="/images/pm.png" // replace with your actual image path
              alt="Student Management"
              className="w-full h-80 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Performance Summary Widget</h3>
            <p>A small widget showing a quick overview of the student’s latest attendance and average marks.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
