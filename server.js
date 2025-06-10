const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const path = require('path');
const MongoStore = require("connect-mongo");
const PDFDocument = require("pdfkit");
const moment = require("moment");

dotenv.config();

const app = express();
const PORT = 5000;

const mongo_uri = process.env.MONGO_URI;
const session_secret = process.env.SESSION_SECRET;
const jwt_secret = process.env.JWT_SECRET;

mongoose
  .connect(mongo_uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const teacherDivisionSubjectSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Division",
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  year: {
    type: String,
    required: true, // e.g., "First Year" or "Third Year"
  },
  branch: {
    type: String,
    required: true, // e.g., "CSE"
  },
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Division",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
});

const divisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // e.g., "A", "B"
  },
  year: {
    type: String,
    required: true, // e.g., "First Year", "Second Year"
  },
  branch: {
    type: String,
    required: true, // e.g., "CSE", "ECE"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

divisionSchema.index({ name: 1, year: 1, branch: 1 }, { unique: true });

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false },
  year: { type: String, required: false, default: 'First Year' },
  branch: { type: String, required: false },
  designation: { type: String, required: false },
  role: { type: String, required: true, default: 'TEACHER' },
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const studentSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false },
  year: { type: String, required: false, default: 'First Year' },
  branch: { type: String, required: false },
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Division",
    required: true,
  },
  prn: { type: String, required: true },
  role: { type: String, required: true, default: 'STUDENT' },
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false },
  role: { type: String, required: true, default: 'ADMIN' },
  username: { type: String, required: true },
  password: { type: String, required: true },
})

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const testMarkSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Test",
    required: true,
  },
  marksObtained: {
    type: Number,
    required: true,
  },
  gradedOn: {
    type: Date,
    default: Date.now,
  },
});

//Models 
const User = mongoose.model('User', userSchema, 'users');
const Teacher = mongoose.model('Teacher', teacherSchema, 'teachers');
const Student = mongoose.model('Student', studentSchema, 'students');
const Division = mongoose.model('Division', divisionSchema, 'divisions');
const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendance');
const Test = mongoose.model('Test', testSchema, 'tests');
const TestMarks = mongoose.model('TestMarks', testMarkSchema, 'testmarks');
const TeacherAssociation = mongoose.model('TeacherAssociation', teacherDivisionSubjectSchema, 'teacherassocs')


const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

//CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      callback(new Error("CORS_DENIED")); // Reject request
    }
  },
  credentials: true
}
)); // Enable CORS for the frontend

//For production
app.set("trust proxy", 1);

//Handler for Errors
app.use((err, req, res, next) => {
  if (err.message === "CORS_DENIED") {
    console.log("CORS Error: Forbidden request");
    return res.status(403).json({ error: "Forbidden: CORS policy does not allow this origin" });
  }
  next(err);
});

//session
app.use(
  session({
    secret: session_secret, // Use a strong secret from .env
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // MongoDB URI
      collectionName: "sessions",
      ttl: 2 * 60 * 60,
      autoRemove: "native"
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      maxAge: 5 * 60 * 60 * 1000, // 2 hours
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);


app.use(express.json());


// Hello Route For Testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

//Login Route
app.post("/api/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Validate input
    if (!username || !password || !role) {
      return res.status(400).json({ error: "Username, password, and role are required" });
    }

    // Determine the collection to query based on role
    let userModel;
    if (role === "ADMIN") {
      userModel = User;
    } else if (role === "TEACHER") {
      userModel = Teacher;
    } else if (role === "STUDENT") {
      userModel = Student;
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Find user
    const user = await userModel.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwt_secret,
      { expiresIn: "2h" }
    );

    // Set session
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Session save failed" });
      }

      // Set cookie
      res.cookie("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 2 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: "Login successful",
        role: user.role,
        name: user.name,
        token,
      });
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//fetch all students
app.get("/api/admin/students", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.session.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access Denied" });
    }

    const students = await Student.find().select("-password");
    res.json(students);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

//delete student
app.delete("/api/students/:studentId", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await Student.findByIdAndDelete(req.params.studentId);
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Profile Endpoint
app.get("/api/me", async (req, res) => {
  try {
    // Check if the user session exists
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { username, role } = req.session.user;

    // Choose model based on role
    let userModel;
    if (role === "ADMIN") {
      userModel = User;
    } else if (role === "TEACHER") {
      userModel = Teacher;
    } else if (role === "STUDENT") {
      userModel = Student;
    } else {
      return res.status(400).json({ error: "Invalid role in session" });
    }

    // Find user profile (excluding password)
    const user = await userModel.findOne({ username }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// Logout endpoint (destroy session)
app.post("/api/logout", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.clearCookie("session_token"); // Clear the cookie
      return res.status(200).json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Route for Registering Teachers
app.post("/api/register/teacher", async (req, res) => {
  const { username, password, name, email, year, branch, designation } = req.body;

  try {
    if (!req.session.user || req.session.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" });
    }

    const existingTeacher = await Teacher.findOne({ username });
    if (existingTeacher) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    const newTeacher = new Teacher({
      name,
      email,
      year,
      branch,
      designation,
      role: "TEACHER",
      username,
      password: hashedPassword,
    });

    await newTeacher.save();
    return res.status(201).json({ message: "Teacher registered successfully" });
  } catch (error) {
    console.error("Error registering teacher:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Route for Registering Students
app.post("/api/register/student", async (req, res) => {
  const { username, password, name, email, year, branch, division, prn } = req.body;

  try {

    const existingStudent = await Student.findOne({ username });
    if (existingStudent) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    console.log(hashedPassword);
    const newStudent = new Student({
      name,
      email,
      year,
      branch,
      division,
      prn,
      role: "STUDENT",
      username,
      password: hashedPassword,
    });

    await newStudent.save();
    return res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    console.error("Error registering student:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Route for registering divisions
app.post("/api/register/division", async (req, res) => {
  const { name, year, branch } = req.body;

  try {
    // Only ADMIN can register a division
    if (!req.session.user || req.session.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check for duplicate division (same name, year, and branch)
    const existingDivision = await Division.findOne({ name, year, branch });
    if (existingDivision) {
      return res.status(400).json({ error: "Division already exists for this year and branch" });
    }

    // Create and save new division
    const newDivision = new Division({
      name,
      year,
      branch,
    });

    await newDivision.save();
    return res.status(201).json({ message: "Division created successfully" });
  } catch (error) {
    console.error("Error creating division:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Route for marking Attendance 
app.post("/api/attendance/save", async (req, res) => {
  const attendanceData = req.body;

  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const teacherId = req.session.user.id;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // const today = new Date();
    // today.setHours(0, 0, 0, 0); // normalize to midnight

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log(today);

    await Promise.all(
      attendanceData.map(async ({ studentId, status, reason }) => {
        const student = await Student.findById(studentId).populate("division");

        if (!student) return;

        await Attendance.findOneAndUpdate(
          {
            student: student._id,
            date: today,
          },
          {
            student: student._id,
            year: student.year,
            branch: student.branch,
            division: student.division._id,
            date: today,
            status,
            reason,
            recordedBy: teacher._id,
          },
          { upsert: true, new: true }
        );
      })
    );

    res.status(200).json({ message: "Attendance saved successfully" });
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//fetch attendance to view student
app.get("/api/attendance/view/student", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Access denied" });
  }

  const studentId = req.session.user.id;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setDate(end.getDate() + 1); // for date range query

    const record = await Attendance.findOne({
      student: studentId,
      date: { $gte: start, $lt: end },
    });

    if (!record) {
      return res.status(404).json({ error: "No attendance record found for this date" });
    }

    res.json({
      status: record.status,
      reason: record.reason || "",
    });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//update attendance reason
app.put("/api/attendance/reason", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Access denied" });
  }

  const studentId = req.session.user.id;
  const { date, reason } = req.body;

  if (!date || reason === undefined) {
    return res.status(400).json({ error: "Date and reason are required" });
  }

  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const record = await Attendance.findOneAndUpdate(
      {
        student: studentId,
        date: { $gte: start, $lt: end },
      },
      { reason },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json({ message: "Reason updated successfully" });
  } catch (err) {
    console.error("Error updating reason:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



//Fetch attendance to view teacher
app.get("/api/attendance/view", async (req, res) => {
  const { divisionId, date } = req.query;

  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!divisionId || !date) {
    return res.status(400).json({ error: "Missing divisionId or date" });
  }

  try {
    const teacher = await Teacher.findById(req.session.user.id);
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

    const division = await Division.findById(divisionId);
    if (!division) return res.status(404).json({ error: "Division not found" });

    // Normalize date (ignore time) 
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);

    const records = await Attendance.find({
      division: new mongoose.Types.ObjectId(divisionId),
      date: { $gte: selectedDate, $lt: nextDay },
      year: division.year, // Match year as stored in attendance
    }).populate("student", "name prn");

    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//fetch defaulters
app.get("/api/attendance/defaulters", async (req, res) => {
  const { month, divisionId } = req.query;

  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const records = await Attendance.aggregate([
      {
        $match: {
          division: new mongoose.Types.ObjectId(divisionId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$student",
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          studentId: "$_id",
          attendancePercentage: {
            $multiply: [{ $divide: ["$present", "$total"] }, 100],
          },
        },
      },
      {
        $match: {
          attendancePercentage: { $lt: 70 },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $project: {
          studentId: 1,
          attendancePercentage: 1,
          name: "$student.name",
          prn: "$student.prn",
        },
      },
    ]);

    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching defaulters:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Defaulter Chart
app.get("/api/defaulters/chart", async (req, res) => {
  const { divisionId, month } = req.query;

  if (!divisionId || !month) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }

  try {
    // Expecting month in format "YYYY-MM"
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1; // JS months are 0-based

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ error: "Invalid month format" });
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 1);

    const students = await Student.find({ division: divisionId });
    let defaulters = 0;

    for (let student of students) {
      const records = await Attendance.find({
        student: student._id,
        date: { $gte: startDate, $lt: endDate },
      });

      const totalDays = records.length;
      const presentDays = records.filter(r => r.status === "Present").length;
      const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      if (percentage < 70) defaulters++;
    }

    res.json({
      defaulters,
      nonDefaulters: students.length - defaulters,
    });
  } catch (error) {
    console.error("Error generating chart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//Fetch improvements
// app.get("/api/marks/improvement", async (req, res) => {
//   const { divisionId } = req.query;

//   if (!req.session.user || req.session.user.role !== "TEACHER") {
//     return res.status(403).json({ error: "Unauthorized" });
//   }

//   try {
//     const result = await TestMarks.aggregate([
//       // Join with students to filter by division
//       {
//         $lookup: {
//           from: "students",
//           localField: "student",
//           foreignField: "_id",
//           as: "studentDetails"
//         }
//       },
//       { $unwind: "$studentDetails" },
//       {
//         $match: {
//           "studentDetails.division": new mongoose.Types.ObjectId(divisionId)
//         }
//       },

//       // Group to compute total obtained marks per student per test
//       {
//         $group: {
//           _id: {
//             student: "$student",
//             test: "$test"
//           },
//           totalObtained: { $sum: "$marksObtained" }
//         }
//       },

//       // Lookup test to get totalMarks (just once per test)
//       {
//         $lookup: {
//           from: "tests",
//           localField: "_id.test",
//           foreignField: "_id",
//           as: "testDetails"
//         }
//       },
//       { $unwind: "$testDetails" },

//       // Now we have totalObtained (per test), and totalMarks (from test)
//       {
//         $project: {
//           student: "$_id.student",
//           obtained: "$totalObtained",
//           total: "$testDetails.totalMarks"
//         }
//       },

//       // Group by student to sum all obtained and total marks
//       {
//         $group: {
//           _id: "$student",
//           totalObtainedAllTests: { $sum: "$obtained" },
//           totalPossibleAllTests: { $sum: "$total" }
//         }
//       },

//       // Calculate percentage
//       {
//         $project: {
//           studentId: "$_id",
//           percentage: {
//             $multiply: [
//               { $divide: ["$totalObtainedAllTests", "$totalPossibleAllTests"] },
//               100
//             ]
//           }
//         }
//       },

//       // Filter students below 50%
//       {
//         $match: {
//           percentage: { $lt: 50 }
//         }
//       },

//       // Lookup student info
//       {
//         $lookup: {
//           from: "students",
//           localField: "studentId",
//           foreignField: "_id",
//           as: "student"
//         }
//       },
//       { $unwind: "$student" },

//       {
//         $project: {
//           name: "$student.name",
//           prn: "$student.prn",
//           percentage: 1
//         }
//       }
//     ]);

//     console.log(result)

//     res.status(200).json(result);
//   } catch (err) {
//     console.error("Error fetching improvement students:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
app.get("/api/marks/improvement", async (req, res) => {
  const { divisionId } = req.query;

  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!divisionId) {
    return res.status(400).json({ error: "Division ID is required" });
  }

  try {
    const students = await Student.find({ division: divisionId });

    const improvementList = [];

    for (const student of students) {
      const testMarks = await TestMarks.find({ student: student._id }).populate("test");

      const subjectScores = { Coding: [], Aptitude: [], Technical: [] };

      for (const mark of testMarks) {
        const totalPerSubject = mark.test.totalMarks / 3;
        const percent = (mark.marksObtained / totalPerSubject) * 100;

        if (subjectScores[mark.subject]) {
          subjectScores[mark.subject].push(percent);
        }
      }

      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const avgCoding = avg(subjectScores.Coding);
      const avgAptitude = avg(subjectScores.Aptitude);
      const avgTechnical = avg(subjectScores.Technical);

      const overallPercentage = (avgCoding+avgAptitude+avgTechnical)/3;

      if (avgCoding < 40 || avgAptitude < 40 || avgTechnical < 40) {
        improvementList.push({
          id: student._id,
          name: student.name,
          prn: student.prn,
          percentage : overallPercentage,
          avgCoding: avgCoding.toFixed(2),
          avgAptitude: avgAptitude.toFixed(2),
          avgTechnical: avgTechnical.toFixed(2),
        });
      }
    }

    res.status(200).json(improvementList);
  } catch (err) {
    console.error("Error fetching improvement students:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//fetch improvement chart
app.get("/api/improvement/chart", async (req, res) => {
  const { divisionId } = req.query;

  if (!divisionId) {
    return res.status(400).json({ error: "Missing required divisionId" });
  }

  try {
    const students = await Student.find({ division: divisionId });
    let improvementCount = 0;

    for (let student of students) {
      const marks = await TestMarks.find({ student: student._id });

      if (marks.length === 0) continue;

      // Group marks by testId
      const testMap = new Map();

      for (let mark of marks) {
        const key = mark.test.toString();
        if (!testMap.has(key)) {
          testMap.set(key, []);
        }
        testMap.get(key).push(mark.marksObtained);
      }

      let totalObtained = 0;
      let totalPossible = 0;

      for (const [testId, marksList] of testMap.entries()) {
        const obtained = marksList.reduce((sum, val) => sum + val, 0);
        totalObtained += obtained;
        totalPossible += marksList.length * 30; // Assuming each subject is out of 30 — make dynamic below
      }

      // Make totalPossible dynamic — get subject-wise total per test (optional)
      // You can also store total marks in `Test` schema if needed

      const percentage =
        totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

      if (percentage < 50) improvementCount++;
    }

    res.json({
      improvement: improvementCount,
      satisfactory: students.length - improvementCount,
    });
  } catch (error) {
    console.error("Error generating improvement chart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tests - Create new test
app.post("/api/tests", async (req, res) => {
  try {
    const { name, year, date, totalMarks } = req.body;

    if (!name || !year || !date || !totalMarks) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newTest = new Test({
      name,
      year,
      date,
      totalMarks,
    });

    await newTest.save();
    return res.status(201).json({ message: "Test created successfully", test: newTest });
  } catch (error) {

    console.error("Error creating test:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Fetch all tests for a year of teacher
app.get("/api/tests/teacher", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "TEACHER") {
      return res.status(403).json({ error: "Access denied" });
    }

    const teacher = await Teacher.findById(req.session.user.id);

    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

    const tests = await Test.find({ year: teacher.year }).sort({ date: -1 });

    res.status(200).json(tests);
  } catch (error) {
    console.error("Error fetching tests for teacher:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// POST /api/tests/:testId/marks - Add or update student's test marks
app.post("/api/tests/marks", async (req, res) => {
  const { marks } = req.body;

  if (!Array.isArray(marks) || marks.length === 0) {
    return res.status(400).json({ error: "Marks data must be a non-empty array" });
  }

  try {
    const savedMarks = [];
    let total = 0;
    let testid = "";

    marks.forEach((markEntry) => {
      testid = markEntry.test;
      total += markEntry.marksObtained;
    })

    const testdata = await Test.findById(testid);
    let persubmark = testdata.totalMarks / 3;

    if (testdata.totalMarks < total) {
      return res.status(400).json({ error: "total exceeds total marks for test" });
    }

    let valid = true;

    marks.forEach((markEntry) => {
      if (persubmark < markEntry.marksObtained) {
        valid = false;
      }
    })

    if (!valid) {
      return res.status(400).json({ error: "Per subject marks should be less than or equal to " + persubmark });
    }

    marks.forEach(async (markEntry) => {
      const { student, subject, test, marksObtained } = markEntry;


      if (!student || !subject || !test || marksObtained == null) {
        return res.status(400).json({ error: "Missing required fields in mark entry" });
      }

      let existingMark = await TestMarks.findOne({ test: test, student: student, subject: subject });

      if (existingMark) {
        // Update
        existingMark.marksObtained = marksObtained;
        existingMark.gradedOn = new Date();
        const saved = await existingMark.save();

        savedMarks.push(saved);
      } else {
        // Create new
        const newMark = new TestMarks({
          test: test,
          subject: subject,
          student: student,
          marksObtained,
        });

        const saved = await newMark.save();
        savedMarks.push(saved);
      }
    })

    res.status(201).json({ message: "Test marks saved successfully", data: savedMarks });
  } catch (error) {
    console.error("Error saving test marks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Performance for individual student for teacher
app.get("/api/performance/teacher/student", async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === "Present").length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    const testMarks = await TestMarks.find({ student: studentId }).populate("test");
    const subjectPercentages = {
      Coding: [],
      Aptitude: [],
      Technical: [],
    };

    // Group by testId
    const marksGroupedByTest = {};
    for (let mark of testMarks) {
      if (!marksGroupedByTest[mark.test._id]) {
        marksGroupedByTest[mark.test._id] = {
          totalMarks: mark.test.totalMarks,
          subjects: {},
        };
      }
      marksGroupedByTest[mark.test._id].subjects[mark.subject] = mark.marksObtained;
    }

    // Calculate subject-wise percentages
    for (let testId in marksGroupedByTest) {
      const { totalMarks, subjects } = marksGroupedByTest[testId];
      const perSubjectMax = totalMarks / 3;

      for (let subject of ["Coding", "Aptitude", "Technical"]) {
        const obtained = subjects[subject] ?? 0;
        const percent = (obtained / perSubjectMax) * 100;
        subjectPercentages[subject].push(percent);
      }
    }

    // Compute averages
    const subjectPerformance = {};
    for (let subject in subjectPercentages) {
      const percentages = subjectPercentages[subject];
      const avg = percentages.length > 0
        ? percentages.reduce((a, b) => a + b, 0) / percentages.length
        : 0;
      subjectPerformance[subject] = avg;
    }

    res.json({
      name: student.name,
      prn: student.prn,
      attendance: attendancePercentage,
      subjectPerformance,
    });

  } catch (error) {
    console.error("Error fetching performance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//Performance for student
app.get("/api/performance/st/summary", async (req, res) => {
  // Ensure student is logged in
  if (!req.session.user || req.session.user.role !== "STUDENT") {
    return res.status(403).json({ error: "Access denied" });
  }

  const studentId = req.session.user.id;

  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Attendance Calculation
    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === "Present").length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Test Marks Processing
    const testMarks = await TestMarks.find({ student: studentId }).populate("test");

    const subjectPercentages = {
      Coding: [],
      Aptitude: [],
      Technical: [],
    };

    const marksGroupedByTest = {};
    let totalObtained = 0;
    let totalPossible = 0;

    for (let mark of testMarks) {
      const testId = mark.test._id;

      // Grouping
      if (!marksGroupedByTest[testId]) {
        marksGroupedByTest[testId] = {
          totalMarks: mark.test.totalMarks,
          subjects: {},
        };
      }
      marksGroupedByTest[testId].subjects[mark.subject] = mark.marksObtained;

      // Total computation
      totalObtained += mark.marksObtained;
      totalPossible += mark.test.totalMarks / 3; // per subject
    }

    // Subject-wise Percentages
    for (let testId in marksGroupedByTest) {
      const { totalMarks, subjects } = marksGroupedByTest[testId];
      const perSubjectMax = totalMarks / 3;

      ["Coding", "Aptitude", "Technical"].forEach(subject => {
        const obtained = subjects[subject] ?? 0;
        const percent = (obtained / perSubjectMax) * 100;
        subjectPercentages[subject].push(percent);
      });
    }

    const subjectPerformance = {};
    for (let subject in subjectPercentages) {
      const values = subjectPercentages[subject];
      const avg = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
      subjectPerformance[subject] = parseFloat(avg.toFixed(2));
    }

    // Overall percentage (all subjects, all tests)
    const overallPercentage = totalPossible > 0
      ? (totalObtained / totalPossible) * 100
      : 0;

    // Final Response
    res.json({
      name: student.name,
      prn: student.prn,
      attendance: parseFloat(attendancePercentage.toFixed(2)),
      subjectPerformance,
      overallPercentage: parseFloat(overallPercentage.toFixed(2)),
    });

  } catch (error) {
    console.error("Error fetching student summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Route for fetching overall attendance performance
app.get("/api/performance/teacher/attendance", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "TEACHER") {
      return res.status(403).json({ error: "Access denied" });
    }

    const teacherId = req.session.user.id;

    // Fetch divisions assigned to the teacher
    const assignments = await TeacherAssociation.find({ teacher: teacherId }).populate("division");

    const divisionIds = assignments.map((assignment) => assignment.division._id);

    // Aggregate attendance data for each division
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          division: { $in: divisionIds },
        },
      },
      {
        $group: {
          _id: "$division",
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "divisions",
          localField: "_id",
          foreignField: "_id",
          as: "divisionDetails",
        },
      },
      {
        $unwind: "$divisionDetails",
      },
      {
        $project: {
          _id: 0,
          divisionId: "$divisionDetails._id",
          divisionName: "$divisionDetails.name",
          year: "$divisionDetails.year",
          branch: "$divisionDetails.branch",
          attendancePercentage: {
            $multiply: [
              { $divide: ["$presentCount", "$totalRecords"] },
              100,
            ],
          },
        },
      },
    ]);

    res.status(200).json(attendanceData);
  } catch (error) {
    console.error("Error fetching attendance performance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Route for fetching overall marks performance for teacher
app.get("/api/performance/teacher/marks", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "TEACHER") {
      return res.status(403).json({ error: "Access denied" });
    }

    const teacherId = req.session.user.id;

    const teacher = await Teacher.findById(teacherId);

    // Fetch divisions assigned to the teacher
    const assignments = await TeacherAssociation.find({ teacher: teacherId }).populate("division");

    const divisionIds = assignments.map((assignment) => assignment.division._id);

    // Fetch students in the assigned divisions
    const students = await Student.find({ division: { $in: divisionIds }, year: teacher.year });

    const studentIds = students.map((student) => student._id);

    // Aggregate marks data for each division and subject
    const marksData = await TestMarks.aggregate([
      {
        $match: {
          student: { $in: studentIds },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      {
        $unwind: "$studentDetails",
      },
      {
        $group: {
          _id: {
            division: "$studentDetails.division",
            subject: "$subject",
          },
          averageMarks: { $avg: "$marksObtained" },
        },
      },
      {
        $lookup: {
          from: "divisions",
          localField: "_id.division",
          foreignField: "_id",
          as: "divisionDetails",
        },
      },
      {
        $unwind: "$divisionDetails",
      },
      {
        $project: {
          _id: 0,
          divisionId: "$divisionDetails._id",
          divisionName: "$divisionDetails.name",
          year: "$divisionDetails.year",
          branch: "$divisionDetails.branch",
          subject: "$_id.subject",
          averageMarks: 1,
        },
      },
    ]);

    res.status(200).json(marksData);
  } catch (error) {
    console.error("Error fetching marks performance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Route for fetching divisions 
app.get("/api/divisions", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const teacherId = req.session.user.id;
  const teacher = await Teacher.findById(teacherId)

  const year = teacher.year;

  try {
    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }

    const divisions = await Division.find({ year });
    return res.status(200).json({ divisions });
  } catch (err) {
    console.error("Error fetching divisions:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Route for fetching divisions based on year
app.get("/api/divisions/year/:year", async (req, res) => {
  try {
    const divisions = await Division.find({ year: req.params.year });
    res.status(200).json(divisions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch divisions" });
  }
});

//Route for fetching divisions based on class
app.get("/api/divisions/teacherclass/:teacherid", async (req, res) => {
  const teacherId = req.params.teacherid;
  const teacher = await Teacher.findById(teacherId)

  const year = teacher.year;

  try {
    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }

    const divisions = await Division.find({ year });
    return res.status(200).json({ divisions });
  } catch (err) {
    console.error("Error fetching divisions:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Route for fetching all teachers
app.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find() // optional: populates division details
      .select("-password"); // exclude password
    return res.status(200).json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Delete a teacher
app.delete("/api/teachers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Use findByIdAndDelete to remove the teacher from the database
    const teacher = await Teacher.findByIdAndDelete(id);

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Fetch all students based on teacher
app.get("/api/students/teacher/:divisionid", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Access Denied" });
  }

  const teacherId = req.session.user.id;

  const divisionId = req.params.divisionid;

  try {
    // Fetch teacher's division
    const teacher = await Teacher.findById(teacherId);
    const division = await Division.findById(divisionId);

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Fetch students in the same division as the teacher
    const students = await Student.find({ division: division._id, year: teacher.year }).populate("division");

    return res.status(200).json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//Assign Teacher
app.post("/api/assign", async (req, res) => {
  const { teacherId, divisionId } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.session.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access Denied" });
  }

  try {
    if (!teacherId || !divisionId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Optional: check if assignment already exists
    const existing = await TeacherAssociation.findOne({ teacher: teacherId, division: divisionId });
    if (existing) {
      return res.status(400).json({ error: "Teacher already assigned to this subject and division" });
    }

    const assignment = new TeacherAssociation({
      teacher: teacherId,
      division: divisionId,
    });

    await assignment.save();
    res.status(201).json({ message: "Teacher assigned successfully" });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//route for fetching all assignments
app.get("/api/assignments", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.session.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access Denied" });
  }

  try {
    const assignments = await TeacherAssociation.find()
      .populate("teacher")
      .populate("division")
      .sort({ assignedAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

//route for fetching all assignments specific to teacher
app.get("/api/assignments/teacher", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Access Denied" });
  }

  const teacherId = req.session.user.id;

  try {
    const assignments = await TeacherAssociation.find({ teacher: teacherId })
      .populate("teacher")
      .populate("division")
      .sort({ assignedAt: -1 });

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ error: "No assignments found for this teacher" });
    }


    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

//PDF GENERATION
app.get("/api/defaulters/pdf", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log(req.query);
  const { month, divisionId } = req.query;

  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!month || !divisionId) {
    return res.status(400).json({ error: "Missing month or divisionId" });
  }

  try {
    const division = await Division.findById(divisionId);
    if (!division) return res.status(404).json({ error: "Division not found" });

    // Calculate start and end of month (YYYY-MM format)
    const [year, monthNum] = month.split("-");
    const startDate = new Date(year, parseInt(monthNum) - 1, 1);
    const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59, 999); // last day of month

    // Get all students in that division
    const students = await Student.find({ division: divisionId });

    // Calculate attendance for each student
    const defaulters = [];

    for (const student of students) {
      const totalDays = await Attendance.countDocuments({
        student: student._id,
        date: { $gte: startDate, $lte: endDate },
      });

      const presentDays = await Attendance.countDocuments({
        student: student._id,
        date: { $gte: startDate, $lte: endDate },
        status: "Present",
      });

      const attendancePercentage = totalDays === 0 ? 0 : (presentDays / totalDays) * 100;

      if (attendancePercentage < 70) {
        defaulters.push({
          name: student.name,
          prn: student.prn,
          attendance: attendancePercentage.toFixed(2),
        });
      }
    }

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Defaulters_${month}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text(`Defaulter Report - ${division.name} (${month})`, { align: "center" });
    doc.moveDown();

    if (defaulters.length === 0) {
      doc.fontSize(14).text("No defaulters found for this month.", { align: "center" });
    } else {
      defaulters.forEach((s, i) => {
        doc.fontSize(12).text(`${i + 1}. ${s.name} (PRN: ${s.prn}) - Attendance: ${s.attendance}%`);
      });
    }

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.get("/api/improvement/pdf", async (req, res) => {
  const { divisionId } = req.query;

  if (!req.session.user || req.session.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!divisionId) {
    return res.status(400).json({ error: "Division ID is required" });
  }

  try {
    const division = await Division.findById(divisionId);
    if (!division) {
      return res.status(404).json({ error: "Division not found" });
    }

    const students = await Student.find({ division: divisionId });

    const improvementStudents = [];

    for (const student of students) {
      const marks = await TestMarks.find({ student: student._id }).populate("test");

      const subjectScores = { Coding: [], Aptitude: [], Technical: [] };

      marks.forEach(mark => {
        const perSubjectMax = mark.test.totalMarks / 3;
        const percent = (mark.marksObtained / perSubjectMax) * 100;
        subjectScores[mark.subject]?.push(percent);
      });

      const avg = subject => {
        const arr = subjectScores[subject];
        return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      };

      const avgCoding = avg("Coding");
      const avgAptitude = avg("Aptitude");
      const avgTechnical = avg("Technical");

      if ((avgCoding+avgAptitude+avgTechnical)/3 < 50) {
        improvementStudents.push({
          name: student.name,
          prn: student.prn,
          overallPercentage : (avgCoding+avgAptitude+avgTechnical)/3,
          avgCoding: avgCoding.toFixed(2),
          avgAptitude: avgAptitude.toFixed(2),
          avgTechnical: avgTechnical.toFixed(2),
        });
      }
    }

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=improvement_students.pdf");

    doc.fontSize(20).text(`Improvement Students Report`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Division: ${division.name}`);
    doc.moveDown();

    improvementStudents.forEach((student, idx) => {
      doc
        .fontSize(12)
        .text(`${idx + 1}. ${student.name} (${student.prn})`)
        .text(`   Overall Percentage: ${student.overallPercentage}%`)
        .text(`   Coding: ${student.avgCoding}%`)
        .text(`   Aptitude: ${student.avgAptitude}%`)
        .text(`   Technical: ${student.avgTechnical}%`)
        .moveDown();
    });

    if (improvementStudents.length === 0) {
      doc.text("No students found for improvement.");
    }

    doc.end();
    doc.pipe(res);
  } catch (err) {
    console.error("Error generating improvement report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

