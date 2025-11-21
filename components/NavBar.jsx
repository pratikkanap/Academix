import React,{useState , useEffect} from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const NavBar = ({user,setUser}) => {
    const navigate = useNavigate();

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
                navigate("/")
                console.error("User not logged in");
            }
        };

        fetchUser();
    }, []);

    return (
        <nav className="bg-gray-600 px-4 py-3 flex justify-between items-center shadow-md">
            <div className="text-white font-bold text-xl">
                <Link to="/">Attendance monitoring and performance evaluation</Link>
            </div>

            <div className="flex gap-4">
                <Link
                    to="/"
                    className="text-white hover:text-gray-200 transition duration-200"
                >
                    Home
                </Link>

                {!user && (
                    <Link
                        to="/login"
                        className="text-white hover:text-gray-200 transition duration-200"
                    >
                        Login
                    </Link>
                )
                }

                {user && user.role === 'TEACHER' && (
                    <Link
                        to="/teacherdash"
                        className="text-white hover:text-gray-200 transition duration-200"
                    >
                        Dashboard
                    </Link>
                )
                }

                {user && user.role === 'ADMIN' && (
                    <Link
                        to="/admindash"
                        className="text-white hover:text-gray-200 transition duration-200"
                    >
                        Dashboard
                    </Link>
                )
                }

                {user && user.role === 'STUDENT' && (
                    <Link
                        to="/studentdash"
                        className="text-white hover:text-gray-200 transition duration-200"
                    >
                        Dashboard
                    </Link>
                )
                }

                <Link
                    to="/register"
                    className="text-white hover:text-gray-200 transition duration-200"
                >
                    Register
                </Link>
            </div>
        </nav>
    );
};

export default NavBar;
