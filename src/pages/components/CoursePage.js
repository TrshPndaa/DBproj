import React, { useState, useEffect } from 'react';
import { Users, BookOpen, ClipboardList } from 'lucide-react';
import QuickCourses from './QuickCourses';
import AddCourseModal from './AddCourseModal';
import './CoursePage.css';

const CourseOverview = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeEnrollments: 0,
    averageCredits: 0,
    successRate: 0
  });

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

  useEffect(() => {
    fetchCourses();
  }, []);

  const calculateAverageCredits = (coursesData) => {
    if (!coursesData.length) return 0;
    const total = coursesData.reduce((sum, course) => sum + course.credits, 0);
    return (total / coursesData.length).toFixed(1);
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
        throw new Error('Failed to update course');
      }

      await fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl dark-card">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
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
              <p className="text-sm font-medium text-gray-500">Active Enrollments</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.activeEnrollments}</p>
              <p className="text-green-600">↑ 12% from last term</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full icon">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl dark-card">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Credits</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.averageCredits}</p>
              <p className="text-yellow-600">↔ No change</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full icon">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl dark-card">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.successRate}%</p>
              <p className="text-green-600">↑ 5% from last term</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full icon">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <QuickCourses
        courses={courses}
        onUpdate={handleUpdateCourse}
        onAdd={() => setShowAddCourseModal(true)}
      />

      {showAddCourseModal && (
        <AddCourseModal
          onClose={() => setShowAddCourseModal(false)}
          onSubmit={async (newCourse) => {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch('/api/courses', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCourse)
              });

              if (!response.ok) {
                throw new Error('Failed to add course');
              }

              await fetchCourses();
              setShowAddCourseModal(false);
            } catch (err) {
              setError(err.message);
            }
          }}
        />
      )}
    </div>
  );
};

export default CourseOverview;