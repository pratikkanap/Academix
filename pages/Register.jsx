import React, { useState } from "react";
import axios from "axios";
import { FaEye , FaEyeSlash} from 'react-icons/fa';

const Register = () => {
    const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const textReg = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    const prnRegex = /^\d{2}UG(CS|ET|CH|ME|CE)\d{5}$/;
    const divRegex = /^[A-Z]$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,12}$/;
    const [showPassword, setShowPassword] = useState(false);

    const years = ["First Year", "Second Year", "Third Year", "Fourth Year"]

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        year: "First Year",
        branch: "",
        division: "",
        prn: "",
        username: "",
        password: "",
    });

    function validateRegistration() {
        if (!textReg.exec(formData.name)) {
            alert("Enter a valid name");
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

        if (!prnRegex.exec(formData.prn)) {
            alert("Enter valid PRN");
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

    const [divisions, setDivisions] = useState([]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchDivisions = async (e) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/divisions/year/${e.target.value}`, { withCredentials: true });
            console.log(res);
            setDivisions(res.data);
        } catch (err) {
            console.error("Error fetching divisions:", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!validateRegistration()) {
            return;
        }

        console.log(formData)
        try {
            const res = await axios.post(
                "http://localhost:5000/api/register/student",
                formData,
                { withCredentials: true } // include session cookie
            );
            alert("Student registered successfully!");
            setSuccess("Student registered successfully!");
            setFormData({
                name: "",
                email: "",
                year: "First Year",
                branch: "",
                division: "",
                prn: "",
                username: "",
                password: "",
            });
        } catch (err) {
            console.log(err);
            if (err.response && err.response.data && err.response.data.error) {
                alert(err.response.data.error);
                setError(err.response.data.error);
            } else {
                alert("Something went wrong");
                setError("Something went wrong");
            }
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg m-4"
            >
                <h2 className="text-2xl font-semibold mb-6 text-blue-600 text-center">
                    Register Student
                </h2>

                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                {[
                    { label: "Name", name: "name" },
                    { label: "Email", name: "email", type: "email" },
                    { label: "PRN", name: "prn" },
                    { label: "Branch", name: "branch" },
                    { label: "Username", name: "username" },
                    // { label: "Password", name: "password", type: "password" },
                ].map(({ label, name, type = "text" }) => (
                    <div key={name} className="mb-4">
                        <label className="block mb-1 text-sm font-medium">{label}</label>
                        <input
                            type={type}
                            name={name}
                            value={formData[name]}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border border-gray-300 rounded"
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
                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium">Year</label>
                    <select
                        name="year"
                        value={formData.year}
                        onChange={(e) => {
                            handleChange(e);
                            fetchDivisions(e);
                        }}
                        className="w-full p-2 border border-gray-300 rounded"
                    >
                        <option>First Year</option>
                        <option>Second Year</option>
                        <option>Third Year</option>
                        <option>Fourth Year</option>
                    </select>
                </div>


                {divisions.length > 0 && (
                    <div className="mb-4">
                        <label className="block mb-1">Select Division</label>
                        <select
                            name="division"
                            value={formData.division}
                            onChange={(e) => { handleChange(e) }}
                            className="w-full border px-3 py-2 rounded"
                            required
                        >
                            <option value="">Select a Division</option>
                            {divisions.map((div) => (
                                <option key={div._id} value={div._id}>
                                    {div.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                >
                    Register Student
                </button>
            </form>
        </div>
    );
};

export default Register;
