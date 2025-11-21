import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Tooltip,
  Legend,
  PieChart, Pie, Cell
} from "recharts";

const StudentDashboard = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState("Attendance");
  const [attendance, setAttendance] = useState(null);
  const [subjectPerformance, setSubjectPerformance] = useState(null);
  const [overallPerformance, setOverallPerformance] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/me", { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch((err) => console.error("Failed to fetch user", err));
  }, []);

  useEffect(() => {
    if (user) {
      axios
        .get(`http://localhost:5000/api/performance/st/summary`, { withCredentials: true })
        .then((res) => {
          setAttendance(res.data.attendance)
          setSubjectPerformance(res.data.subjectPerformance)
          setOverallPerformance(res.data.overallPercentage)
          console.log(res);
        })
        .catch((err) => {
          setMessage("Failed to fetch performance data");
          console.error("Error fetching performance", err);
        });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/logout", {}, { withCredentials: true });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  //ATTENDANCE UPDATE
  const [selectedDate, setSelectedDate] = useState("");
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [reason, setReason] = useState("");

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/view/student`, {
        params: { date: selectedDate },
        withCredentials: true
      });
      setAttendanceRecord(res.data);
      setReason(res.data.reason || "");
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setAttendanceRecord(null);
      setReason("");
    }
  };

  const saveAttendanceReason = async () => {
    try {
      await axios.put(`http://localhost:5000/api/attendance/reason`, {
        date: selectedDate,
        reason,
      }, { withCredentials: true });
      alert("Reason updated successfully!");
    } catch (err) {
      console.error("Failed to update reason:", err);
      alert("Error saving reason.");
    }
  };

  return (
    <div className="flex min-h-[94vh]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-700 text-white flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6 p-4">Student Dashboard</h2>

          {/* View Performance button */}
          <button
            className="block w-full text-left px-4 py-2 rounded bg-gray-800"
            onClick={() => {
              window.scrollTo(0, document.body.scrollHeight)
              setActiveTab("viewAttendance")
            }} // Scroll to performance section
          >
            View Attendance
          </button>
          <button
            className="block w-full text-left px-4 py-2 rounded bg-gray-800"
            onClick={() => {
              window.scrollTo(0, document.body.scrollHeight)
              setActiveTab("Attendance")
            }} // Scroll to performance section
          >
            Attendance Performance
          </button>
          <button
            className="block w-full text-left px-4 py-2 rounded bg-gray-800"
            onClick={() => {
              setActiveTab("Subject")
            }} // Scroll to performance section
          >
            Subject Performance
          </button>
          <button
            className="block w-full text-left px-4 py-2 rounded bg-gray-800"
            onClick={() => {
              setActiveTab("Overall")
            }} // Scroll to performance section
          >
            Overall Performance
          </button>
        </div>

        {/* Profile section */}
        <div className="relative mt-4">
          <div
            className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white text-gray-700 font-bold flex items-center justify-center">
                {user?.name?.[0] || "U"}
              </div>
              <span>{user?.name || "User"}</span>
            </div>
            <span>▼</span>
          </div>

          {showDropdown && (
            <div className="absolute bottom-12 left-0 w-full bg-white text-black rounded shadow">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 bg-gray-100">
        {message && <div className="text-red-600 mb-4">{message}</div>}

        {/* Performance Section */}
        {attendance >= 0 && subjectPerformance && overallPerformance ? (
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-2xl font-semibold text-black-700 mb-4">My Performance</h2>
            <div className="space-y-4">
              {activeTab === "Attendance" && <>
                <div>
                  <h3 className="font-medium text-green-600">Average Attendance</h3>
                  <h4 className="font-bold">{attendance} %</h4>
                  <p>
                    {attendance < 70
                      ? "You are a defaulter (Attendance < 70%)"
                      : "Your attendance is fine."}
                  </p>
                  <div className="shadow-lg p-2">
                    <PieChart width={600} height={300}>
                      <Pie
                        data={[
                          { name: "Present", value: attendance },
                          { name: "Absent", value: 100 - attendance },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        <Cell fill="#22c55e" /> {/* Green */}
                        <Cell fill="#ef4444" /> {/* Red */}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>
                </div>
                <hr />
              </>}

              {activeTab === "Subject" && <>
                <div>
                  <h3 className="font-medium text-green-600">Average Marks Per Subject</h3>
                  <ul className="space-y-2 my-2">
                    <p className="font-bold">Aptitude : {subjectPerformance.Aptitude}%</p>
                    <p className="font-bold">Technical : {subjectPerformance.Technical}%</p>
                    <p className="font-bold">Coding : {subjectPerformance.Coding}%</p>
                  </ul>
                  <div className="shadow-lg p-2">
                    <PieChart width={600} height={400}>
                      <Pie
                        data={[
                          { name: "Coding", value: subjectPerformance.Coding },
                          { name: "Aptitude", value: subjectPerformance.Aptitude },
                          { name: "Technical", value: subjectPerformance.Technical },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        label
                      >
                        <Cell fill="#3b82f6" /> {/* Blue */}
                        <Cell fill="#f59e0b" /> {/* Amber */}
                        <Cell fill="#10b981" /> {/* Emerald */}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>
                </div>
                <hr />
              </>}
              {activeTab === "Overall" && <>
                <div>
                  <h3 className="font-medium text-green-600">Overall Marks</h3>
                  <p>
                    Average Marks across all subjects: {overallPerformance}%{" "}
                    {overallPerformance < 50 ? "(Needs Improvement)" : "(Good)"}
                  </p>
                  <div className="shadow-lg p-2">
                    <PieChart width={600} height={300}>
                      <Pie
                        data={[
                          { name: "Scored", value: overallPerformance },
                          { name: "Not Scored", value: 100 - overallPerformance },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        <Cell fill="#22c55e" /> {/* Green */}
                        <Cell fill="#3358ff" /> {/* Red */}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>
                </div>
                <hr />
              </>}

              {activeTab === "viewAttendance" && (
                <>
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Check Attendance by Date</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-80 border p-2 rounded"
                      />
                      <button
                        onClick={fetchAttendance}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        Get Attendance
                      </button>
                    </div>

                    {attendanceRecord && (
                      <div className="bg-white rounded-lg shadow p-4 max-w-md">
                        <h4 className="text-lg font-semibold mb-2">Date: {selectedDate}</h4>
                        <p className="mb-2">
                          <span className="font-semibold">Status:</span>{" "}
                          {attendanceRecord.status}
                        </p>
                        {attendanceRecord.status !== "Present" && <>
                          <label className="block font-semibold mb-1">Reason:</label>
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="border p-2 rounded w-full mb-2"
                            placeholder="Enter reason for absence"
                          />
                          <button
                            onClick={saveAttendanceReason}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                          >
                            Save Reason
                          </button>
                        </>}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">My Performance</h2>
            <p>Your performance data is not recorded so far</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
