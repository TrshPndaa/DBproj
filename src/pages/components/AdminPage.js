import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  UserPlus,
  LogOut,
  School,
  Settings,
  Menu,
  X,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import StudentOverview from './StudentOverview';

const AdminDashboard = () => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [user, setUser] = useState(null);

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

      const [students, teachers, courses] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        coursesRes.json()
      ]);

      setStats({
        students: students.length,
        teachers: teachers.length,
        courses: courses.length,
        attendance: 0
      });
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: School },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'enrollment', label: 'Enrollment', icon: ClipboardList },
    { id: 'parents', label: 'Parents', icon: UserPlus },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

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
        <div className="header__container">
          <div className="header__left">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-btn"
            >
              {isMobileMenuOpen ? <X className="icon" /> : <Menu className="icon" />}
            </button>
            <div className="brand">
              <School className="brand__icon" />
              <span className="brand__text">Admin Dashboard</span>
            </div>
          </div>
          
          <div className="header__right">
            <button
              onClick={() => setShowProfileDialog(true)}
              className="profile-btn"
            >
              {user?.username}
            </button>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="icon" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard__body">
        <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar--open' : ''}`}>
          <nav className="sidebar__nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`nav-item ${
                    activeSection === item.id ? 'nav-item--active' : ''
                  }`}
                >
                  <Icon className="nav-item__icon" />
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
                <div className="error-alert__icon-wrapper">
                  <X className="error-alert__icon" />
                </div>
                <div className="error-alert__text">
                  <h3 className="error-alert__title">Error</h3>
                  <div className="error-alert__message">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="stats">
            <div className="stats__card">
              <div className="stats__content">
                <div className="stats__info">
                  <p className="stats__label">Total Students</p>
                  <p className="stats__value">{stats.students}</p>
                </div>
                <Users className="stats__icon stats__icon--blue" />
              </div>
            </div>

            <div className="stats__card">
              <div className="stats__content">
                <div className="stats__info">
                  <p className="stats__label">Total Teachers</p>
                  <p className="stats__value">{stats.teachers}</p>
                </div>
                <Users className="stats__icon stats__icon--green" />
              </div>
            </div>

            <div className="stats__card">
              <div className="stats__content">
                <div className="stats__info">
                  <p className="stats__label">Active Courses</p>
                  <p className="stats__value">{stats.courses}</p>
                </div>
                <BookOpen className="stats__icon stats__icon--purple" />
              </div>
            </div>

            <div className="stats__card">
              <div className="stats__content">
                <div className="stats__info">
                  <p className="stats__label">Today's Attendance</p>
                  <p className="stats__value">{stats.attendance}%</p>
                </div>
                <Calendar className="stats__icon stats__icon--orange" />
              </div>
            </div>
          </div>

          <section className="section">
            <h2 className="section__title">
              {menuItems.find(item => item.id === activeSection)?.label}
            </h2>
            
            <div className="section__content">
              {activeSection === 'overview' && (
                <p className="welcome-message">
                  Welcome to the admin dashboard. Select a section from the sidebar to manage your school system.
                </p>
              )}
              {activeSection === 'students' && <StudentOverview />}

            </div>
          </section>
        </main>
      </div>

      {showProfileDialog && (
        <div className="modal">
          <div className="modal__backdrop" onClick={() => setShowProfileDialog(false)} />
          <div className="modal__container">
            <div className="modal__content">
              <div className="modal__header">
                <h3 className="modal__title">Profile Information</h3>
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
              </div>
              <div className="modal__footer">
                <button
                  className="modal__close-btn"
                  onClick={() => setShowProfileDialog(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;