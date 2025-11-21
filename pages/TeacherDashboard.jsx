import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart, Pie, Cell
} from "recharts";

const TeacherDashboard = ({ user, setUser }) => {
    const navigate = useNavigate();

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [tests, setTests] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentAttendance, setStudentAttendance] = useState({});
    const [activeTab, setActiveTab] = useState("addData");
    const [selectedClass, setSelectedClass] = useState("");
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [divisions, setDivisions] = useState([]);
    const [allPCheck, setAllP] = useState(false);
    const [allACheck, setAllA] = useState(false);

    //View Attendance
    const [selectedDate, setSelectedDate] = useState("");
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState("");

    const fetchAttendance = () => {
        if (!selectedDivision || !selectedDate) return;

        axios
            .get("http://localhost:5000/api/attendance/view", {
                params: {
                    divisionId: selectedDivision,
                    date: selectedDate,
                },
                withCredentials: true,
            })
            .then((res) => {
                console.log(res.data);
                setAttendanceData(res.data);
            })
            .catch((err) => console.error("Error fetching attendance:", err));
    };

    //PERFORMANCE
    const [attendancePerformanceData, setAttendancePerformanceData] = useState([]);
    const [marksPerformanceData, setMarksPerformanceData] = useState([]);
    const [groupedByDivision, setGroupedByDivision] = useState({});

    const [marksData, setMarksData] = useState({
        aptitude: "",
        technical: "",
        coding: "",
        testId: "",
    });

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/tests/teacher", { withCredentials: true })
            .then((response) => {
                setTests(response.data);
            })
            .catch((error) => console.error(error));
    }, []);

    const handleAddDataClick = (student) => {
        setSelectedStudent(student);
        setShowAddStudentModal(true);
    };

    const handleCloseModal = () => {
        setShowAddStudentModal(false);
        setMarksData({ aptitude: "", technical: "", coding: "", testId: "" });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMarksData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const studentId = selectedStudent._id;

        const payload = {
            marks: [
                {
                    student: studentId,
                    subject: "Aptitude",
                    test: marksData.testId,
                    marksObtained: Number(marksData.aptitude),
                },
                {
                    student: studentId,
                    subject: "Technical",
                    test: marksData.testId,
                    marksObtained: Number(marksData.technical),
                },
                {
                    student: studentId,
                    subject: "Coding",
                    test: marksData.testId,
                    marksObtained: Number(marksData.coding),
                },
            ],
        };

        try {
            const response = await axios.post("http://localhost:5000/api/tests/marks", payload, { withCredentials: true });
            alert(response.data.message);
            handleCloseModal(); // Close the modal after success
        } catch (error) {
            console.error(error);
            alert(error.response.data.error);
        }
    };

    // Fetch user data and classes on mount
    useEffect(() => {
        axios.get("http://localhost:5000/api/me", { withCredentials: true })
            .then((res) => {
                setUser(res.data.user)

            })
            .catch((err) => {
                console.error("Error fetching user:", err)
                navigate("/");
            });

        axios.get("http://localhost:5000/api/assignments/teacher", { withCredentials: true })
            .then((res) => {
                setTeacherAssignments(res.data);
                populateDivisions(res.data);
            })
            .catch((err) => console.error("Error fetching classes:", err));

        axios
            .get("http://localhost:5000/api/performance/teacher/attendance", {
                withCredentials: true,
            })
            .then((res) => {
                setAttendancePerformanceData(res.data); // expecting array like [{ divisionName: 'A', attendancePercentage: 85 }]
            })
            .catch((err) => {
                console.error("Error fetching attendance performance:", err);
            });

        // Fetch marks performance
        axios
            .get("http://localhost:5000/api/performance/teacher/marks", {
                withCredentials: true,
            })
            .then((res) => {
                setMarksPerformanceData(res.data); // expecting array like [{ divisionName: 'A', averageMarks: 75 }]

                const grouped = {};
                res.data.forEach((item) => {
                    const divisionKey = item.divisionId;
                    if (!grouped[divisionKey]) {
                        grouped[divisionKey] = {
                            divisionName: item.divisionName,
                            year: item.year,
                            branch: item.branch,
                            subjects: [],
                        };
                    }
                    grouped[divisionKey].subjects.push({
                        subject: item.subject,
                        averageMarks: item.averageMarks,
                    });
                });

                setGroupedByDivision(grouped);
            })
            .catch((err) => {
                console.error("Error fetching marks performance:", err);
            });

    }, []);

    const fetchStudents = (e) => {
        axios
            .get(`http://localhost:5000/api/students/teacher/${e.target.value}`, { withCredentials: true })
            .then((response) => {
                console.log(response);
                setStudents(response.data.students);
            })
            .catch((error) => console.error(error));
    }

    const populateDivisions = (data) => {
        const uniqueDivisionsMap = new Map();
        data.forEach((assignment) => {
            const division = assignment.division;
            if (division && !uniqueDivisionsMap.has(division._id)) {
                uniqueDivisionsMap.set(division._id, division);
            }
        });

        const uniqueDivisions = Array.from(uniqueDivisionsMap.values());
        setDivisions(uniqueDivisions);
    }

    // Handle attendance change
    // const handleAttendanceChange = (studentId, status, reason) => {
    //     setStudentAttendance((prev) => ({
    //         ...prev,
    //         [studentId]: {
    //             ...(prev[studentId] || {}),
    //             status: status || prev[studentId]?.status || "Mark",
    //             reason: reason !== null ? reason : prev[studentId]?.reason || "",
    //         },
    //     }));
    // };
    const handleAttendanceCheckbox = (studentId, status) => {
        setStudentAttendance((prev) => {
            // If clicked again, uncheck it
            if (prev[studentId]?.status === status) {
                return {
                    ...prev,
                    [studentId]: { status: "", reason: "" },
                };
            }

            return {
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    status,
                },
            };
        });
    };

    const handleReasonChange = (studentId, value) => {
        setStudentAttendance((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                reason: value,
            },
        }));
    };

    const handleAllPresent = () => {
        const newState = {};

        if(allACheck)
        {
            setAllA(false);
        }

        if (!allPCheck) {
            students.forEach((student) => {
                newState[student._id] = {
                    status: "Present",
                    reason: "",
                };
            });
        } else {
            students.forEach((student) => {
                newState[student._id] = {
                    status: "",
                    reason: "",
                };
            });
        }

        setStudentAttendance(newState);
        setAllP(!allPCheck);
    };

    const handleAllAbsent = () => {
        const newState = {};

        if(allPCheck)
        {
            setAllP(false);
        }

        if (!allACheck) {
            students.forEach((student) => {
                newState[student._id] = {
                    status: "Absent",
                    reason: "",
                };
            });
        } else {
            students.forEach((student) => {
                newState[student._id] = {
                    status: "",
                    reason: "",
                };
            });
        }

        setStudentAttendance(newState);
        setAllA(!allACheck);
    };




    const saveAttendance = async () => {
        const attendanceArray = Object.entries(studentAttendance).map(([studentId, { status, reason }]) => ({
            studentId,
            status,
            reason,
        }));

        if (attendanceArray.length === 0) {
            console.log("Please update attendance for all students");
        }

        try {
            const res = await axios.post("http://localhost:5000/api/attendance/save", attendanceArray, {
                withCredentials: true,
            });

            console.log("Attendance saved:", res.data);
            alert("Attendance saved successfully");
        } catch (error) {
            console.error("Error saving attendance:", error);
            alert("Failed to save attendance");
        }
    };


    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:5000/api/logout", {}, { withCredentials: true });
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    //DEFAULTERS
    const [selectedMonth, setSelectedMonth] = useState("");
    const [defaulters, setDefaulters] = useState([]);
    const [defaulterChartData, setDefaulterChartData] = useState([]);

    const DCOLORS = ["#FF6384", "#36A2EB"];

    const fetchDefaulters = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/attendance/defaulters", {
                params: {
                    month: selectedMonth,
                    divisionId: selectedDivision,
                },
                withCredentials: true,
            });
            setDefaulters(response.data);
        } catch (error) {
            console.error("Failed to fetch defaulters:", error);
        }
    };

    const fetchDefaulterChartData = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/defaulters/chart", {
                params: {
                    divisionId: selectedDivision,
                    month: selectedMonth, // e.g., '04' for April
                },
            });

            console.log(response);

            const { defaulters, nonDefaulters } = response.data;

            const formattedData = [
                { name: "Defaulters", value: defaulters },
                { name: "Non-Defaulters", value: nonDefaulters },
            ];

            console.log(formattedData);

            setDefaulterChartData(formattedData);
        } catch (err) {
            console.error("Failed to fetch defaulter chart data:", err);
        }
    };


    const generateDefaulterPDF = async () => {
        if (!selectedMonth || !selectedDivision) return alert("Please select both month and division");

        try {
            const response = await axios.get("http://localhost:5000/api/defaulters/pdf", {
                params: { "month": selectedMonth, "divisionId": selectedDivision },
                withCredentials: true,
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Defaulters_${selectedDivision}_${selectedMonth}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF.");
        }
    };


    //IMPROVEMENTS
    const [improvementStudents, setImprovementStudents] = useState([]);
    const [improvementChartData, setImprovementChartData] = useState([]);

    const ICOLORS = ["#ef4444", "#10b981"];

    const fetchImprovementStudents = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/marks/improvement", {
                params: { divisionId: selectedDivision },
                withCredentials: true,
            });
            console.log(response);
            setImprovementStudents(response.data);
        } catch (err) {
            console.error("Failed to fetch improvement students:", err);
        }
    };

    const fetchImprovementChart = async () => {
        axios
            .get("http://localhost:5000/api/improvement/chart", {
                params: { divisionId: selectedDivision },
            })
            .then((res) => {
                const { improvement, satisfactory } = res.data;
                setImprovementChartData([
                    { name: "Need Improvement", value: improvement },
                    { name: "Satisfactory", value: satisfactory },
                ]);
            })
            .catch((err) => {
                console.error("Error fetching improvement chart:", err);
            });
    }

    const generateImprovementPDF = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/improvement/pdf", {
                params: { "divisionId": selectedDivision },
                withCredentials: true,
                responseType: "blob",
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Improvements_${selectedDivision}_${selectedMonth}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF.");
        }
    };

    //INDIVIDUAL PERFORMANCE
    const [studentPerformance, setStudentPerformance] = useState(null);
    const [selectedStudentPerformance, setSelectedStudentPerformance] = useState("");

    const fetchStudentPerformance = async () => {
        if (!selectedStudentPerformance) return;

        try {
            const response = await axios.get("http://localhost:5000/api/performance/teacher/student", {
                params: { studentId: selectedStudentPerformance },
                withCredentials: true
            });

            const data = response.data;
            console.log("Student Performance:", data);
            setStudentPerformance(data);
        } catch (error) {
            console.error("Error fetching performance:", error);
        }
    };

    //STUDENTS
    const handleDelete = (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        axios.delete(`http://localhost:5000/api/students/${studentId}`, { withCredentials: true })
            .then(() => {
                setStudents(prev => prev.filter(s => s._id !== studentId));
            })
            .catch(err => console.error("Error deleting student:", err));
    };

    return (
        <div className="flex min-h-[94vh]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-700 text-white flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-6 p-4">Teacher Dashboard</h2>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("addData")}
                    >
                        Add Student Data
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("Attendance")}
                    >
                        Mark Attendance
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("ViewAttendance")}
                    >
                        View Attendance
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("Performance")}
                    >
                        View Performance Division
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("PerformanceSt")}
                    >
                        View Performance Student
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("Defaulters")}
                    >
                        View Defaulters
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("Istudents")}
                    >
                        View Improvement Students
                    </button>
                    <button
                        className="block w-full text-left px-4 py-2 rounded bg-gray-800"
                        onClick={() => setActiveTab("Students")}
                    >
                        View Students
                    </button>
                </div>

                {/* Profile Section */}
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
                {/* Add Student Data Modal */}
                {activeTab === "addData" && (
                    <div className="container mx-auto">
                        <h1 className="text-2xl font-semibold mb-4">Add Student Data</h1>

                        {divisions.length > 0 && (
                            <div className="mb-4">
                                <label className="block mb-1">Select Division</label>
                                <select
                                    value={divisions.divisionId}
                                    onChange={(e) => { fetchStudents(e) }}
                                    className="w-full border px-3 py-2 rounded"
                                    required
                                >
                                    <option value="">Select a Division</option>
                                    {divisions.map((div) => (
                                        <option key={div._id} value={div._id}>
                                            {div.name} ({div.year}, {div.branch})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Table displaying students */}
                        {students.length > 0 &&
                            <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
                                <table className="w-full mt-4 text-left table-auto min-w-max">
                                    <thead>
                                        <tr>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Name</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">PRN</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Year</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Branch</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Division</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Add Data</p>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student._id}>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {student?.name}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {student?.prn}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {student?.year}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {student?.branch}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {student?.division.name}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        <button
                                                            onClick={() => handleAddDataClick(student)}
                                                            className="bg-gray-500 text-white py-1 px-4 rounded"
                                                        >
                                                            Add Data
                                                        </button>
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>}

                        {/* Modal for adding marks */}
                        {showAddStudentModal && (
                            <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex justify-center items-center shadow-xl">
                                <div className="bg-white p-6 rounded-lg w-1/3">
                                    <h2 className="text-xl mb-4">Add Marks for {selectedStudent.name}</h2>
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Select Test</label>
                                            <select
                                                name="testId"
                                                value={marksData.testId}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded"
                                                required
                                            >
                                                <option value="">Select a test</option>
                                                {tests.map((test) => (
                                                    <option key={test._id} value={test._id}>
                                                        {test.name} - {test.date}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Aptitude Marks</label>
                                            <input
                                                type="number"
                                                name="aptitude"
                                                value={marksData.aptitude}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Technical Marks</label>
                                            <input
                                                type="number"
                                                name="technical"
                                                value={marksData.technical}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded"
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Coding Marks</label>
                                            <input
                                                type="number"
                                                name="coding"
                                                value={marksData.coding}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded"
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-between">
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                className="bg-gray-500 text-white py-1 px-4 rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-500 text-white py-1 px-4 rounded"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Attendance Table */}
                {activeTab === "Attendance" && (
                    <div className="bg-white p-6 rounded shadow-lg mb-6">
                        <h2 className="text-2xl font-semibold text-black-700 mb-4">Mark Attendance</h2>
                        {divisions.length > 0 && (
                            <div className="mb-4">
                                <label className="block mb-1">Select Division</label>
                                <select
                                    value={divisions.divisionId}
                                    onChange={(e) => {
                                        fetchStudents(e);
                                        setAllP(false);
                                    }}
                                    className="w-full border px-3 py-2 rounded"
                                    required
                                >
                                    <option value="">Select a Division</option>
                                    {divisions.map((div) => (
                                        <option key={div._id} value={div._id}>
                                            {div.name} ({div.year}, {div.branch})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
                            <p className="p-2 block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
                                <input
                                    className="mr-1"
                                    type="checkbox"
                                    checked={allPCheck}
                                    onChange={() => handleAllPresent()}
                                />
                                Mark All Present
                            </p>
                             <p className="p-2 block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">
                                <input
                                    className="mr-1"
                                    type="checkbox"
                                    checked={allACheck}
                                    onChange={() => handleAllAbsent()}
                                />
                                Mark All Absent
                            </p>
                            <table className="text-left table-auto">
                                <thead>
                                    <tr>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Student Name</p>
                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Attendance</p>

                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Reason</p>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student._id}>
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {student?.name}
                                                </p>
                                            </td>
                                            {/* <td>{student.name}</td> */}
                                            {/* <td className="p-4 border-b border-blue-gray-50">
                                                <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    <select
                                                        onChange={(e) => handleAttendanceChange(student._id, e.target.value)}
                                                        className="p-2"
                                                    >
                                                        <option value="Mark">Mark</option>
                                                        <option value="Present">Present</option>
                                                        <option value="Absent">Absent</option>
                                                        <option value="Late">Late</option>
                                                    </select>
                                                </p>
                                            </td> */}
                                            <td className="p-4 border-b border-blue-gray-50">
                                                <div className="flex gap-4">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {["Present", "Absent", "Late"].map((status) => (
                                                            <label key={status} className="flex items-center gap-1 text-sm text-blue-gray-900">
                                                                <input
                                                                    type="radio"
                                                                    checked={studentAttendance[student._id]?.status === status}
                                                                    onChange={() => handleAttendanceCheckbox(student._id, status)}
                                                                />
                                                                {status}
                                                            </label>
                                                        ))}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* <td className="p-4 border-b border-blue-gray-50">
                                                <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    <input
                                                        type="text"
                                                        placeholder="Reason"
                                                        className="p-2"
                                                        onChange={(e) => handleAttendanceChange(student._id, null, e.target.value)}
                                                    />
                                                </p>
                                            </td> */}
                                            {((studentAttendance[student._id]?.status === "Absent" ||
                                                studentAttendance[student._id]?.status === "Late")) ? (
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        <input
                                                            type="text"
                                                            placeholder="Enter reason"
                                                            value={studentAttendance[student._id]?.reason || ""}
                                                            onChange={(e) => handleReasonChange(student._id, e.target.value)}
                                                            className="p-2"
                                                        />
                                                    </p>
                                                </td>
                                            ) : <td className="p-4 border-b border-blue-gray-50"></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={saveAttendance}
                            className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                        >
                            Save Attendance
                        </button>

                    </div>
                )}

                {/* View Performance */}
                {activeTab === "Performance" && (
                    <div className="bg-white p-6 rounded shadow-lg">
                        <h2 className="text-2xl font-semibold text-black-700 mb-6">Division Performance Overview</h2>

                        {/* Attendance Chart */}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Average Attendance by Division</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={attendancePerformanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="divisionName" />
                                    <YAxis domain={[0, 150]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="attendancePercentage" name="Attendance (%)" fill="#4f46e5" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Marks Chart */}

                        <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Average Marks by Division</h3>
                            {Object.entries(groupedByDivision).map(([divisionId, divisionData]) => (
                                <div key={divisionId} className="mb-8">
                                    <h3 className="text-lg font-medium mb-2">
                                        Division {divisionData.divisionName} ({divisionData.year}, {divisionData.branch})
                                    </h3>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={divisionData.subjects}>
                                            <XAxis dataKey="subject" />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="averageMarks" fill="#3182ce" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "ViewAttendance" && (
                    <div className="bg-white p-6 rounded shadow-lg mt-6">
                        <h2 className="text-2xl font-semibold text-black-700 mb-4">View Attendance</h2>

                        <div className="flex flex-wrap flex-col gap-4 mb-4">
                            <div className="w-full md:w-1/3">
                                <label className="block mb-1">Select Date</label>
                                <input
                                    type="date"
                                    className="w-full border px-3 py-2 rounded"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                            {divisions.length > 0 && (
                                <div className="mb-4">
                                    <label className="block mb-2">Select Division</label>
                                    <select
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                        className="w-80 p-2 border rounded rounded-lg"
                                    >
                                        <option value="">Select a Division</option>
                                        {divisions.map((div) => (
                                            <option key={div._id} value={div._id}>
                                                {div.name} ({div.year}, {div.branch})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="w-full md:w-1/3 flex items-end">
                                <button
                                    onClick={fetchAttendance}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    View Attendance
                                </button>
                            </div>
                        </div>

                        {attendanceData.length > 0 ? (
                            <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
                                <table className="w-full mt-4 text-left table-auto min-w-max">
                                    <thead>
                                        <tr>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Student</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">PRN</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Status</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Reason</p>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceData.map((record) => (
                                            <tr key={record._id}>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {record.student?.name}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {record.student?.prn}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {record.status}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {record.reason || "—"}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            selectedDivision &&
                            selectedDate && (
                                <p className="text-gray-600 mt-4">No attendance records found for this date and division.</p>
                            )
                        )}
                    </div>
                )}

                {activeTab === "Defaulters" && (
                    <div className="bg-white p-6 rounded shadow-lg mt-6">
                        <h2 className="text-2xl font-semibold text-red-600 mb-4">Monthly Attendance Defaulters</h2>

                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="w-full md:w-1/3">
                                <label className="block mb-1">Select Month</label>
                                <input
                                    type="month"
                                    className="w-full border px-3 py-2 rounded"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                />
                            </div>
                            {divisions.length > 0 && (
                                <div className="w-full md:w-1/3">
                                    <label className="block mb-1">Select Division</label>
                                    <select
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                        className="w-full border px-3 py-2 rounded"
                                    >
                                        <option value="">Select a Division</option>
                                        {divisions.map((div) => (
                                            <option key={div._id} value={div._id}>
                                                {div.name} ({div.year}, {div.branch})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="w-full md:w-1/3 flex items-end">
                                <button
                                    onClick={() => {
                                        fetchDefaulters();
                                        fetchDefaulterChartData();
                                    }}
                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                >
                                    Get Defaulters
                                </button>
                            </div>
                        </div>

                        {defaulters.length > 0 ? (
                            <div className="relative flex flex-col w-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
                                <div className="w-full md:w-1/3 flex items-end">
                                    <button
                                        onClick={() => {
                                            generateDefaulterPDF();
                                        }}
                                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                    >
                                        Generate PDF
                                    </button>
                                </div>
                                <table className="w-full mt-4 text-left table-auto min-w-max">
                                    <thead>
                                        <tr>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Student</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">PRN</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Attendance %</p>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {defaulters.map((student) => (
                                            <tr key={student.studentId}>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {student?.name}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                        {student?.prn}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-blue-gray-50">
                                                    <p className="block font-sans text-sm antialiased font-bold leading-normal text-red-500">
                                                        {student?.attendancePercentage.toFixed(2)}%
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            selectedDivision &&
                            selectedMonth && (
                                <p className="text-gray-600 mt-4">No defaulters found for selected month and division.</p>
                            )
                        )}
                        <br />
                        <h3 className="text-xl font-semibold mb-4 text-blue-700">Defaulter Ratio</h3>
                        <PieChart width={600} height={400}>
                            <Pie
                                data={defaulterChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {defaulterChartData.map((entry, index) => (
                                    <Cell key={entry.name} fill={DCOLORS[index % DCOLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </div>
                )}

                {activeTab === "Istudents" && (
                    <div className="bg-white p-6 rounded shadow-lg mt-6">
                        <h2 className="text-2xl font-semibold text-yellow-700 mb-4">Students Needing Improvement (Avg. Marks &lt; 50%)</h2>

                        <div className="flex flex-wrap gap-4 mb-4">
                            {divisions.length > 0 && (
                                <div className="w-full md:w-1/3">
                                    <label className="block mb-1">Select Division</label>
                                    <select
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                        className="w-full border px-3 py-2 rounded"
                                    >
                                        <option value="">Select a Division</option>
                                        {divisions.map((div) => (
                                            <option key={div._id} value={div._id}>
                                                {div.name} ({div.year}, {div.branch})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="w-full md:w-1/3 flex items-end">
                                <button
                                    onClick={() => {
                                        fetchImprovementStudents();
                                        fetchImprovementChart();
                                    }}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                                >
                                    Get Students
                                </button>
                            </div>

                        </div>

                        {improvementStudents.length > 0 ? (
                            <div className="relative flex flex-col w-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
                                <div className="w-full md:w-1/3 flex items-end">
                                    <button
                                        onClick={() => {
                                            generateImprovementPDF();
                                        }}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                    >
                                        Generate PDF
                                    </button>
                                </div>
                                <table className="w-full mt-4 text-left table-auto min-w-max">
                                    <thead>
                                        <tr>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Student</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">PRN</p>
                                            </th>
                                            <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Average Marks</p>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {improvementStudents.map((student) => (
                                            <tr key={student._id}>
                                                <td className="p-4 border-b border-gray-100">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-gray-900">
                                                        {student?.name}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-gray-100">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-gray-900">
                                                        {student?.prn}
                                                    </p>
                                                </td>
                                                <td className="p-4 border-b border-gray-100">
                                                    <p className="block font-sans text-sm antialiased font-normal leading-normal text-red-500">
                                                        {student?.percentage.toFixed(2)}%
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            selectedDivision && (
                                <p className="text-gray-600 mt-4">No students found with average marks below 50%.</p>
                            )
                        )}
                        <div className="mt-6 bg-white p-4 rounded shadow-lg">
                            <h2 className="text-xl font-semibold text-blue-700 mb-4">
                                Performance Overview (Marks)
                            </h2>
                            <PieChart width={500} height={400}>
                                <Pie
                                    data={improvementChartData}
                                    cx="50%"
                                    cy="50%"
                                    label
                                    outerRadius={100}
                                    dataKey="value"
                                >
                                    {improvementChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={ICOLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </div>
                    </div>
                )}


                {/* Individual Performance */}
                {activeTab === "PerformanceSt" && (
                    <div className="bg-white p-6 rounded shadow-lg mt-6">
                        <h2 className="text-2xl font-semibold text-black-700 mb-4">
                            Individual Student Performance
                        </h2>

                        <div className="flex flex-wrap gap-4 mb-4">
                            {divisions.length > 0 && (
                                <div className="mb-4">
                                    <label className="block mb-1">Select Division</label>
                                    <select
                                        value={divisions.divisionId}
                                        onChange={(e) => { fetchStudents(e) }}
                                        className="w-full border px-3 py-2 rounded"
                                        required
                                    >
                                        <option value="">Select a Division</option>
                                        {divisions.map((div) => (
                                            <option key={div._id} value={div._id}>
                                                {div.name} ({div.year}, {div.branch})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {students.length > 0 && (
                                <div className="w-full md:w-1/3">
                                    <label className="block mb-1">Select Student</label>
                                    <select
                                        className="w-full border px-3 py-2 rounded"
                                        value={selectedStudentPerformance}
                                        onChange={(e) => setSelectedStudentPerformance(e.target.value)}
                                    >
                                        <option value="">Select a Student</option>
                                        {students.map((student) => (
                                            <option key={student._id} value={student._id}>
                                                {student.name} ({student.prn})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="w-full flex items-end">
                                <button
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    onClick={fetchStudentPerformance}
                                >
                                    Get Performance
                                </button>
                            </div>
                        </div>

                        {studentPerformance && (
                            <>
                                <div className="mt-6">
                                    <h3 className="text-xl font-semibold mb-2">
                                        Performance for: {studentPerformance.name} ({studentPerformance.prn})
                                    </h3>
                                    <p><strong>Attendance %:</strong> {studentPerformance.attendance.toFixed(2)}%</p>
                                    <p><strong>Aptitude %:</strong> {studentPerformance.subjectPerformance.Aptitude.toFixed(2)}%</p>
                                    <p><strong>Technical %:</strong> {studentPerformance.subjectPerformance.Technical.toFixed(2)}%</p>
                                    <p><strong>Coding %:</strong> {studentPerformance.subjectPerformance.Coding.toFixed(2)}%</p>
                                </div>
                                <br />
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Attendance</h3>
                                    <PieChart width={600} height={300}>
                                        <Pie
                                            data={[
                                                { name: "Present", value: studentPerformance.attendance },
                                                { name: "Absent", value: 100 - studentPerformance.attendance },
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

                                {/* Subject-wise Donut Chart */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Subject Performance</h3>
                                    <PieChart width={600} height={400}>
                                        <Pie
                                            data={[
                                                { name: "Coding", value: studentPerformance.subjectPerformance.Coding },
                                                { name: "Aptitude", value: studentPerformance.subjectPerformance.Aptitude },
                                                { name: "Technical", value: studentPerformance.subjectPerformance.Technical },
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
                            </>
                        )}
                    </div>
                )}

                {activeTab === "Students" && <>
                    <div className="p-4 bg-white rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4">Student List by Division</h2>

                        {divisions.length > 0 && (
                            <div className="mb-4">
                                <label className="block mb-1">Select Division</label>
                                <select
                                    value={divisions.divisionId}
                                    onChange={(e) => { fetchStudents(e) }}
                                    className="w-full border px-3 py-2 rounded"
                                    required
                                >
                                    <option value="">Select a Division</option>
                                    {divisions.map((div) => (
                                        <option key={div._id} value={div._id}>
                                            {div.name} ({div.year}, {div.branch})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {students.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {students.map((student) => (
                                    <div
                                        key={student._id}
                                        className="border p-4 rounded shadow-sm flex justify-between items-start"
                                    >
                                        <div>
                                            <h3 className="font-bold text-lg">{student.name}</h3>
                                            <p>PRN: {student.prn}</p>
                                            <p>Email: {student.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(student._id)}
                                            className="text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>}
            </div>
        </div >
    );
};

export default TeacherDashboard;
