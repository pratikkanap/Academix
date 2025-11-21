import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        if (role == "ADMIN") {
          navigate('/admindash');
        } else if (role == "TEACHER") {
          navigate('/teacherdash');
        } else {
          navigate('/studentdash');
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-black-600">Login to Attendance Evaluation</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <label className="block mb-2 text-sm text-left font-medium">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
        >
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>

        <label className="block mb-2 text-sm text-left font-medium">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          required
        />

        <div className="relative mb-4">
          <label htmlFor="password" className="block mb-1 text-sm text-black-700">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-2 border rounded"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 bottom-2.5 text-gray-600"
          >
            {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
