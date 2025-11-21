import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const AdminDashboard = ({ user, setUser }) => {
    const [activeTab, setActiveTab] = useState("addteacher");
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [assignment, setAssignment] = useState({
        teacherId: "",
        divisionId: "",
    });

    const years = ["First Year", "Second Year", "Third Year", "Fourth Year"];

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        year: "",
        branch: "",
        designation: "",
        username: "",
        password: "",
    });

    //Validation 
    const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const textReg = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    const prnRegex = /^\d{2}UG(CS|ET|CH|ME|CE)\d{5}$/;
    const divRegex = /^[A-Z]$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,12}$/;

    function validateTeacherRegistration() {
        if (!textReg.exec(formData.name)) {
            alert("Enter a valid name");
            return false;
        }

        if (!textReg.exec(formData.branch)) {
            alert("Enter a valid branch name");
            return false;
        }

        if (!textReg.exec(formData.designation)) {
            alert("Enter a valid designation");
            return false;
        }

        if (!emailReg.exec(formData.email)) {
            alert("Enter valid  email");
            return false;
        }

        if (!years.includes(formData.year)) {
            alert("Select a valid year");
            return false;
        }

        if (formData.email !== formData.username) {
            alert("username and email should be equal");
            return false;
        }

        if (!emailReg.exec(formData.username)) {
            alert("Enter Valid Username");
            return false;
        }

        if (!passwordRegex.exec(formData.password)) {
            alert("Enter a valid password\npassword must contain following pattern\nshould have 8 to 12 characters\nmust be alphanumeric \nmust contain one uppercase , one lowercase character\nmust contain one digit \nmust contain one special symbol")
            return false;
        }

        return true;
    }

    const [divisionFormData, setDivisionFormData] = useState({
        name: "",
        year: "First Year",
        branch: "",
    });

    function validateDivisionRegistration() {
        if (!divRegex.exec(divisionFormData.name)) {
            alert("Enter a valid division name");
            return false;
        }

        if (!textReg.exec(divisionFormData.branch)) {
            alert("Enter a valid branch name");
            return false;
        }

        if (!years.includes(divisionFormData.year)) {
            alert("Select a valid year");
            return false;
        }

        return true;
    }

    const [message, setMessage] = useState("");
    // const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/me", { withCredentials: true })
            .then((res) => setUser(res.data.user))
            .catch((err) => console.error("Failed to fetch user", err));

        axios
            .get("http://localhost:5000/api/teachers", { withCredentials: true })
            .then((res) => {
                setTeachers(res.data.teachers || [])
            })
            .catch((err) => console.error("Error fetching teachers", err));

        fetchAssignments();
    }, []);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage("");
    }

    const fetchDivisionsByTeacherClass = async (teacherId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/divisions/teacherclass/${teacherId}`, { withCredentials: true });
            console.log(res);
            setDivisions(res.data.divisions);
        } catch (err) {
            console.error("Error fetching divisions:", err);
        }
    };

    const handleDivisionChange = (e) => {
        setDivisionFormData({ ...divisionFormData, [e.target.name]: e.target.value });
        setMessage("");
    };

    const handleDivisionSubmit = async (e) => {
        e.preventDefault();

        if (!validateDivisionRegistration()) {
            return;
        }

        try {
            const res = await axios.post(
                "http://localhost:5000/api/register/division",
                divisionFormData,
                { withCredentials: true }
            );
            setMessage("Division added successfully!");
            setDivisionFormData({ name: "", year: "First Year", branch: "" });
        } catch (err) {
            setMessage(err.response?.data?.error || "Failed to add division");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!validateTeacherRegistration()) {
            return;
        }

        try {
            const res = await axios.post("http://localhost:5000/api/register/teacher", formData, {
                withCredentials: true,
            });

            if (res.status === 201) {
                setMessage("Teacher added successfully");
                setFormData({
                    name: "",
                    email: "",
                    year: "First Year",
                    branch: "",
                    designation: "",
                    username: "",
                    password: "",
                });
            }
        } catch (error) {
            setMessage(error.response?.data?.error || "Failed to add teacher");
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

    const handleDelete = async (teacherId) => {
        if (!confirm("Are you sure to delete ?")) {
            return;
        }
        try {
            // Call the backend route to delete the teacher
            const res = await axios.delete(`http://localhost:5000/api/teachers/${teacherId}`, {
                withCredentials: true, // Optional: if you want to include session cookies
            });

            // Optionally, update the local state to remove the teacher from the UI
            setTeachers((prevTeachers) =>
                prevTeachers.filter((teacher) => teacher._id !== teacherId)
            );

            // Handle success (e.g., show a success message)
            alert("Teacher deleted successfully");
        } catch (err) {
            // Handle error
            console.error("Error deleting teacher:", err);
            alert("Failed to delete teacher");
        }
    };

    const fetchAssignments = async () => {
        await axios
            .get("http://localhost:5000/api/assignments", { withCredentials: true })
            .then((res) => {
                console.log(res);
                setAssignments(res.data || [])
            })
            .catch((err) => console.error("Error fetching assignments", err));
    }

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/assign", assignment, { withCredentials: true });
            setMessage("Teacher assigned successfully!");
            setAssignment({ teacherId: "", divisionId: "" });
            fetchAssignments();
            setSelectedTeacher(null);
        } catch (err) {
            console.error(err);
            setMessage(err.response.data.error);
        }
    };

    //Test
    const [testData, setTestData] = useState({
        name: "",
        year: "",
        date: "",
        totalMarks: "",
    });


    const handleChangeTestData = (e) => {
        setTestData({ ...testData, [e.target.name]: e.target.value });
    };

    const handleCreateTest = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const res = await axios.post(
                "http://localhost:5000/api/tests",
                {
                    name: testData.name,
                    year: testData.year,
                    date: testData.date,
                    totalMarks: parseInt(testData.totalMarks),
                },
                { withCredentials: true }
            );

            setMessage("Test created successfully!");
            setTestData({ name: "", year: "First Year", date: "", totalMarks: "" });
        } catch (error) {
            console.error("Error creating test:", error);
            setMessage("Failed to create test.");
        }
    };

    return (
        <div className="flex min-h-[94vh]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-700 text-white flex flex-col justify-between">
                <div className="">
                    <h2 className="text-xl font-bold mb-2 p-6">Admin Panel</h2>
                    <button
                        className={`block w-full text-left rounded px-2 py-2 ${activeTab === "addteacher" ? "bg-gray-800" : ""
                            }`}
                        onClick={() => setActiveTab("addteacher")}
                    >
                        Add Teacher
                    </button>
                    <button
                        className={`block w-full text-left rounded px-2 py-2 ${activeTab === "adddivision" ? "bg-gray-800" : ""
                            }`}
                        onClick={() => setActiveTab("adddivision")}
                    >
                        Add Division
                    </button>
                    <button
                        className={`block w-full text-left rounded px-2 py-2 ${activeTab === "createtest" ? "bg-gray-800" : ""
                            }`}
                        onClick={() => setActiveTab("createtest")}
                    >
                        Create Test
                    </button>
                    <button
                        className={`block w-full text-left rounded px-2 py-2 ${activeTab === "associate" ? "bg-gray-800" : ""
                            }`}
                        onClick={() => setActiveTab("associate")}
                    >
                        Associate Teacher
                    </button>
                    <button
                        className={`block w-full text-left px-2 py-2 rounded ${activeTab === "view" ? "bg-gray-900" : ""
                            }`}
                        onClick={() => setActiveTab("view")}
                    >
                        View Teachers
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
                {activeTab === "addteacher" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4 text-black-700">
                            Register New Teacher
                        </h2>
                        {message && (
                            <div className="mb-4 text-sm text-green-600">{message}</div>
                        )}
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Name", name: "name" },
                                { label: "Email", name: "email", type: "email" },
                                { label: "Branch", name: "branch" },
                                { label: "Designation", name: "designation" },
                                { label: "Username", name: "username" },
                                // { label: "Password", name: "password", type: "password" },
                            ].map(({ label, name, type = "text" }) => (
                                <div key={name}>
                                    <label htmlFor={name} className="block mb-1 text-sm text-black-700">
                                        {label}
                                    </label>
                                    <input
                                        type={type}
                                        name={name}
                                        id={name}
                                        value={formData[name]}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded border border-gray-300"
                                        required
                                    />
                                </div>
                            ))}
                            <div className="relative">
                                <label htmlFor="password" className="block mb-1 text-sm text-black-700">
                                    Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
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

                            {/* Year Dropdown */}
                            <div>
                                <label htmlFor="year" className="block mb-1 text-sm text-black-700">Year</label>
                                <select
                                    name="year"
                                    id="year"
                                    value={formData.year}
                                    onChange={(e) => {
                                        handleChange(e);
                                    }}
                                    className="w-full px-3 py-2 rounded border border-gray-300"
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {["First Year", "Second Year", "Third Year", "Fourth Year"].map((yr) => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gray-700 text-white py-2 rounded mt-4 hover:bg-blue-800 col-span-2"
                            >
                                Register Teacher
                            </button>
                        </form>
                    </>
                )}

                {activeTab === "adddivision" && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4 text-black-700">
                            Add New Division
                        </h2>
                        {message && (
                            <div className="mb-4 text-sm text-green-600">{message}</div>
                        )}
                        <form onSubmit={handleDivisionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-black-700 mb-1">Division Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={divisionFormData.name}
                                    onChange={handleDivisionChange}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="e.g., A"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-black-700 mb-1">Year</label>
                                <select
                                    name="year"
                                    value={divisionFormData.year}
                                    onChange={handleDivisionChange}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-black-700 mb-1">Branch</label>
                                <input
                                    type="text"
                                    name="branch"
                                    value={divisionFormData.branch}
                                    onChange={handleDivisionChange}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="e.g., CSE"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gray-700 text-white py-2 rounded hover:bg-blue-800"
                            >
                                Add Division
                            </button>
                        </form>
                    </>
                )}

                {activeTab === "view" && (
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                            View Teachers
                        </h2>
                        <div className="relative flex flex-col w-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
                            <table className="w-full mt-4 text-left table-auto min-w-max">
                                <thead>
                                    <tr>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Name</p>
                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Email</p>
                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Year</p>
                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Branch</p>
                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Designation</p>
                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Action</p>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map((teacher) => (
                                        <tr key={teacher._id}>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {teacher.name}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {teacher.email}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {teacher.year}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {teacher.branch}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {teacher.designation}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    <button
                                                        onClick={() => handleDelete(teacher._id)}
                                                        className="text-red-500 hover:text-red-700">Delete
                                                    </button>
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "associate" && (
                    <>
                        <h2 className="text-xl font-bold mb-4 text-center text-gray-700">Assign Teacher to Division</h2>

                        {message && (
                            <div className="mb-4 text-sm text-green-600">{message}</div>
                        )}

                        <form onSubmit={handleAssign} className="grid gap-4">
                            {/* Teacher Dropdown */}
                            <div>
                                <label className="block mb-1">Select Teacher</label>
                                <select
                                    value={assignment.teacherId}
                                    onChange={(e) => {
                                        const teacher = teachers.find((t) => t._id === e.target.value);
                                        setSelectedTeacher(teacher);
                                        setAssignment({ ...assignment, teacherId: e.target.value });
                                        fetchDivisionsByTeacherClass(teacher._id);
                                    }}
                                    className="w-full border px-3 py-2 rounded"
                                    required
                                >
                                    <option value="">Select a Teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher._id} value={teacher._id}>
                                            {teacher.name} ({teacher.year})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Division Dropdown */}
                            {divisions.length > 0 && (
                                <div>
                                    <label className="block mb-1">Select Division</label>
                                    <select
                                        value={assignment.divisionId}
                                        onChange={(e) => setAssignment({ ...assignment, divisionId: e.target.value })}
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

                            <button type="submit" className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-blue-800">
                                Assign
                            </button>
                        </form>
                        <br />
                        <div className="relative flex flex-col w-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border">
                            <table className="w-full mt-4 text-left table-auto min-w-max">
                                <thead>
                                    <tr>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Teacher Name</p>
                                        </th>
                                        <th className="p-4 border-b border-blue-gray-100 bg-gray-200">
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Email</p>
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
                                            <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70">Assigned At</p>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a) => (
                                        <tr key={a._id}>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {a.teacher?.name || "-"}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {a.teacher?.email || "-"}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {a.teacher?.year || "-"}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {a.teacher?.branch || "-"}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {a.division?.name || "-"}
                                                </p>
                                            </td>
                                            <td class="p-4 border-b border-blue-gray-50">
                                                <p class="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900">
                                                    {new Date(a.assignedAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === "createtest" && (
                    <div className="p-6 bg-white rounded shadow-md w-full max-w-lg">
                        <h2 className="text-xl font-semibold mb-4 text-black-700">Create New Test</h2>
                        <form onSubmit={handleCreateTest} className="space-y-4">
                            <div>
                                <label className="block text-sm text-black-700 mb-1">Test Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={testData.name}
                                    onChange={(e) => {
                                        handleChangeTestData(e)
                                    }}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="e.g., Unit Test 1"
                                />
                            </div>
                            <div>
                                <label htmlFor="year" className="block mb-1 text-sm text-black-700">Year</label>
                                <select
                                    name="year"
                                    id="year"
                                    value={testData.year}
                                    onChange={(e) => {
                                        handleChangeTestData(e);
                                    }}
                                    className="w-full px-3 py-2 rounded border border-gray-300"
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {["First Year", "Second Year", "Third Year", "Fourth Year"].map((yr) => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="date" className="block mb-1 font-medium text-gray-700">
                                    Test Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    id="date"
                                    value={testData.date}
                                    onChange={handleChangeTestData}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label htmlFor="totalMarks" className="block mb-1 font-medium text-gray-700">
                                    Total Marks
                                </label>
                                <input
                                    type="number"
                                    name="totalMarks"
                                    id="totalMarks"
                                    value={testData.totalMarks}
                                    onChange={handleChangeTestData}
                                    required
                                    min={1}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-blue-800"
                            >
                                Create Test
                            </button>
                        </form>
                        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
