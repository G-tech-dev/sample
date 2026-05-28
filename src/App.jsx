import React, { useState } from 'react';
import { 
  FaSchool, 
  FaChalkboardTeacher, 
  FaCalendarAlt, 
  FaUsers, 
  FaChartLine, 
  FaTasks, 
  FaStar, 
  FaUserGraduate,
  FaCheckCircle,
  FaTimesCircle,
  FaBook,
  FaGithub,
  FaVideo,
  FaPlus,
  FaClipboardList,
  FaRegClock
} from 'react-icons/fa';
import { 
  MdRoom, 
  MdAssignment, 
  MdTrendingUp,
  MdEmail
} from 'react-icons/md';
import { 
  GiOpenBook,
  GiComputerFan
} from 'react-icons/gi';

const App = () => {
  // Sample data for the class
  const [students, setStudents] = useState([
    { id: 1, name: "jado", email: "jado@mutovu.edu", attendance: 85, grade: "A" },
    { id: 2, name: "Diane", email: "diane.m@mutovu.edu", attendance: 92, grade: "A-" },
    { id: 3, name: "zenobie", email: "zenobie.h@mutovu.edu", attendance: 78, grade: "B+" },
    { id: 4, name: "dasizi", email: "dasizi.u@mutovu.edu", attendance: 95, grade: "A" },
    { id: 5, name: "lambert", email: "lambert.n@mutovu.edu", attendance: 68, grade: "B" },
    { id: 6, name: "bizzman", email: "bizziman.i@mutovu.edu", attendance: 88, grade: "B+" },
  ]);

  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Class information
  const classInfo = {
    name: "L5 Software Development",
    level: "Level 5",
    room: "Lab 203",
    schedule: "Monday & Wednesday | 14:00 - 17:00",
    instructor: "Mr. IGIRANEZA El Gibbor",
    year: "2025-2026",
  };

  // Upcoming assignments
  const assignments = [
    { id: 1, title: "wake up and cheating", dueDate: "2025-06-15", status: "Pending" },
    { id: 2, title: "wake up and cheating", dueDate: "2025-06-22", status: "Pending" },
    { id: 3, title: "wake up and cheating", dueDate: "2025-06-30", status: "In Progress" },
  ];

  // Attendance records
  const [attendanceRecords, setAttendanceRecords] = useState([
    { date: "2025-05-28", present: [1, 2, 3, 4, 5], absent: [6] },
    { date: "2025-05-26", present: [1, 2, 3, 4, 6], absent: [5] },
    { date: "2025-05-21", present: [1, 2, 3, 4, 5, 6], absent: [] },
  ]);

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendancePercentage = (studentId) => {
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => 
      record.present.includes(studentId)
    ).length;
    return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  };

  const markAttendance = (studentId, status) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceRecords.find(record => record.date === today);
    
    if (todayRecord) {
      setAttendanceRecords(prevRecords =>
        prevRecords.map(record =>
          record.date === today
            ? {
                ...record,
                present: status === 'present' 
                  ? [...record.present, studentId]
                  : record.present.filter(id => id !== studentId),
                absent: status === 'absent'
                  ? [...record.absent, studentId]
                  : record.absent.filter(id => id !== studentId),
              }
            : record
        )
      );
    } else {
      setAttendanceRecords(prevRecords => [
        ...prevRecords,
        {
          date: today,
          present: status === 'present' ? [studentId] : [],
          absent: status === 'absent' ? [studentId] : [],
        }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with School Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <FaSchool className="text-4xl" />
                 Mutovu TSS
              </h1>
              <p className="text-blue-200 mt-1">Technical Secondary School - Software Development Department</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Academic Year</p>
              <p className="font-semibold">{classInfo.year}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Class Header Card */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <GiComputerFan className="text-2xl" /> {classInfo.name}
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full ml-3">{classInfo.level}</span>
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FaChalkboardTeacher className="text-2xl text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Instructor</p>
                <p className="font-medium">{classInfo.instructor}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MdRoom className="text-2xl text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Room</p>
                <p className="font-medium">{classInfo.room}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FaCalendarAlt className="text-2xl text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Schedule</p>
                <p className="font-medium">{classInfo.schedule}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FaUsers className="text-2xl text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Students</p>
                <p className="font-medium">{students.length} Enrolled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Attendance</p>
                <p className="text-3xl font-bold text-green-600">84%</p>
              </div>
              <FaChartLine className="text-4xl text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Assignments</p>
                <p className="text-3xl font-bold text-purple-600">{assignments.length}</p>
              </div>
              <MdAssignment className="text-4xl text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Top Performance</p>
                <p className="text-3xl font-bold text-blue-600">A</p>
              </div>
              <FaStar className="text-4xl text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Main Grid: Students + Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <FaUserGraduate className="text-indigo-500" />
                    Students Roster
                  </h3>
                  <button
                    onClick={() => setShowAttendance(!showAttendance)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      showAttendance 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaClipboardList />
                    {showAttendance ? 'Hide Attendance' : 'Mark Attendance'}
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {students.map((student) => {
                  const attendancePercent = getAttendancePercentage(student.id);
                  return (
                    <div
                      key={student.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{student.name}</h4>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MdEmail className="text-xs" /> {student.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getGradeColor(student.grade)}`}>
                            Grade: {student.grade}
                          </span>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-600">Attendance:</span>
                              <span className={`font-semibold ${attendancePercent >= 80 ? 'text-green-600' : attendancePercent >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {attendancePercent}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Student Details */}
                      {selectedStudent?.id === student.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <MdTrendingUp /> Performance Metrics
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <div className="flex justify-between text-sm">
                                    <span>Attendance Rate</span>
                                    <span>{attendancePercent}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${attendancePercent}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {showAttendance && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">📋 Mark Today's Attendance</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAttendance(student.id, 'present');
                                    }}
                                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <FaCheckCircle /> Present
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAttendance(student.id, 'absent');
                                    }}
                                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <FaTimesCircle /> Absent
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Assignments & Info */}
          <div className="space-y-6">
            {/* Assignments Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaTasks className="text-orange-500" />
                  Upcoming Assignments
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 hover:bg-gray-50">
                    <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <FaRegClock /> Due: {assignment.dueDate}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 px-6 py-3">
                <button className="w-full text-center text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center justify-center gap-2">
                  <FaPlus className="text-xs" /> Add New Assignment
                </button>
              </div>
            </div>

            {/* Class Resources */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <GiOpenBook className="text-green-600" />
                  Class Resources
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <FaBook className="text-2xl text-indigo-500" />
                  <div>
                    <p className="font-medium text-gray-800">Course Syllabus</p>
                    <p className="text-xs text-gray-500">Updated: May 2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <FaGithub className="text-2xl text-gray-700" />
                  <div>
                    <p className="font-medium text-gray-800">GitHub Classroom</p>
                    <p className="text-xs text-gray-500">Access all projects</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <FaVideo className="text-2xl text-red-500" />
                  <div>
                    <p className="font-medium text-gray-800">Lecture Recordings</p>
                    <p className="text-xs text-gray-500">Last 5 sessions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaRegClock className="text-purple-500" />
                  Recent Activity
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm text-gray-700">Cheating</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm text-gray-700">New assignment posted: Cheating</p>
                    <p className="text-xs text-gray-400">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                  <div>
                    <p className="text-sm text-gray-700">Cheating</p>
                    <p className="text-xs text-gray-400">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Carred Mutovu TSS - L5 Software Development Class Management System
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Empowering future software developers with quality education
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;