import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  School,
  BookOpen,
  Calendar,
  ClipboardList,
  UserPlus,
  LogOut,
  Settings,
  Menu,
  X,
  Loader
} from 'lucide-react';
import QuickStudents from './QuickStudents';
import QuickTeachers from './QuickTeachers';
import AddStudentModal from './AddStudentModal';
import AddTeacherModal from './AddTeacherModal';
import StudentOverview from './StudentOverview';
import './AdminPage.css';
import TeacherOverview from './TeacherOverview';
import QuickCourses from './QuickCourses';
import CourseOverview from './CoursePage';
import AddCourseModal from './AddCourseModal';

const AdminPage = () => {
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    attendance: 0
  });
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || userData?.role !== 'admin') {
      navigate('/');
      return;
    }

    setUser(userData);
    fetchDashboardData();
  }, [navigate]);

  const calculateAverageCredits = (coursesData) => {
    if (!coursesData.length) return 0;
    const total = coursesData.reduce((sum, course) => sum + course.credits, 0);
    return (total / coursesData.length).toFixed(1);
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [studentsRes, teachersRes, coursesRes] = await Promise.all([
        fetch('/api/students', { headers }),
        fetch('/api/teachers', { headers }),
        fetch('/api/courses', { headers })
      ]);

      if (!studentsRes.ok || !teachersRes.ok || !coursesRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [studentsData, teachersData, coursesData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        coursesRes.json()
      ]);

      setStudents(studentsData);
      setTeachers(teachersData);
      setCourses(coursesData);
      setStats({
        students: studentsData.length,
        teachers: teachersData.length,
        courses: coursesData.length,
        attendance: calculateAttendance(studentsData.length)
      });
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAttendance = (totalStudents) => {
    return Math.floor(Math.random() * 20 + 80);
  };
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data);

      // Calculate stats
      setStats({
        totalCourses: data.length,
        activeEnrollments: data.reduce((sum, course) => sum + (course.enrollments || 0), 0),
        averageCredits: calculateAverageCredits(data),
        successRate: 87 // Example static value - replace with actual calculation
      });

      setError('');
    } catch (err) {
      setError('Failed to load courses data');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateCourse = async (updatedCourse) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${updatedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedCourse)
      });

      if (!response.ok) {
        throw new Error({error});
      }

      await fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStudent = async (updatedStudent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students/${updatedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedStudent)
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTeacher = async (updatedTeacher) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teachers/${updatedTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTeacher)
      });

      if (!response.ok) {
        throw new Error('Failed to update teacher');
      }

      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            <div className="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl dark-card">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Students</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{stats.students}</p>
                      <p className="text-green-600">↑ 12% from last month</p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-full icon">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl dark-card">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{stats.teachers}</p>
                      <p className="text-green-600">↑ 5% from last month</p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-full icon">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl dark-card">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Courses</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{stats.courses}</p>
                      <p className="text-green-600">↑ 8% from last month</p>
                    </div>
                    <div className="bg-purple-500 p-3 rounded-full icon">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl dark-card">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Today's Attendance</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{stats.attendance}%</p>
                      <p className="text-green-600">↑ 3% from last month</p>
                    </div>
                    <div className="bg-orange-500 p-3 rounded-full icon">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="quick-access">
              <QuickStudents
                students={students}
                onUpdate={handleUpdateStudent}
                onAdd={() => setShowAddStudentModal(true)}
              />
              <QuickTeachers
                teachers={teachers}
                onUpdate={handleUpdateTeacher}
                onAdd={() => setShowAddTeacherModal(true)}
              />
              </div>
              <div class="gapformodal">
              <QuickCourses
              courses={courses}
              onUpdate={handleUpdateCourse}
              onAdd={() => setShowAddCourseModal(true)}/>
            </div>
          </>
        );
      case 'students':
        return <StudentOverview />;
      case 'teachers':
        return <TeacherOverview/>;
      case 'courses':
        return <CourseOverview />;
      case 'attendance':
        return <div>Attendance Section</div>;
      case 'enrollment':
        return <div>Enrollment Section</div>;
      case 'settings':
        return <div>Settings Section</div>;
      default:
        return <div>Overview</div>;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <Loader className="loading-icon" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="header">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <div className="flex items-center ml-4">
              <School className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-semibold text-white">Admin Dashboard</span>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setShowProfileDialog(true)}
              className="flex items-center mx-4 text-gray-300 hover:text-white"
            >
              {user?.username}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-300 hover:text-white"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard__body">
        <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar--open' : ''}`}>
          <nav className="nav">
            {[
              { id: 'overview', label: 'Overview', icon: School },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'teachers', label: 'Teachers', icon: Users },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'enrollment', label: 'Enrollment', icon: ClipboardList },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-item__label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="main-content">
          {error && (
            <div className="error-alert">
              <div className="error-alert__content">
                <div className="error-alert__text">{error}</div>
              </div>
            </div>
          )}

          {renderContent()}
        </main>
      </div>

      {showAddStudentModal && (
        <AddStudentModal
          onClose={() => setShowAddStudentModal(false)}
          onSubmit={async (newStudent) => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch('/api/students', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(newStudent)
              });

              if (!response.ok) {
                throw new Error('Failed to add student');
              }

              await fetchDashboardData();
              setShowAddStudentModal(false);
            } catch (err) {
              setError(err.message);
            }
          }}
        />
      )}

      {showAddTeacherModal && (
        <AddTeacherModal
          onClose={() => setShowAddTeacherModal(false)}
          onSubmit={async (newTeacher) => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch('/api/teachers', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTeacher)
              });

              if (!response.ok) {
                throw new Error('Failed to add teacher');
              }

              await fetchDashboardData();
              setShowAddTeacherModal(false);
            } catch (err) {
              setError(err.message);
            }
          }}
        />
      )}

      {showProfileDialog && (
        <div className="modal">
          <div className="modal__backdrop" onClick={() => setShowProfileDialog(false)} />
          <div className="modal__content">
            <div className="modal__header">
              <h3 className="modal__title">Profile Information</h3>
            </div>
            <div className="modal__body">
              <div className="profile-field">
                <p className="profile-field__label">Username</p>
                <p className="profile-field__value">{user?.username}</p>
              </div>
              <div className="profile-field">
                <p className="profile-field__label">Email</p>
                <p className="profile-field__value">{user?.email}</p>
              </div>
              <div className="profile-field">
                <p className="profile-field__label">Role</p>
                <p className="profile-field__value">{user?.role}</p>
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="modal__btn modal__btn--primary"
                onClick={() => setShowProfileDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;