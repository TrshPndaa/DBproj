import React, { useState } from 'react';
import { Plus, Search, X, Save } from 'lucide-react';

const QuickCourses = ({ courses = [], onUpdate, onAdd }) => {  // Add default empty array
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpdateCourse = async (updatedCourse) => {
    await onUpdate?.(updatedCourse);  // Add optional chaining
    setEditingCourse(null);
  };

  const filteredCourses = courses?.filter(course =>  // Add null check with optional chaining
    course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];  // Provide empty array as fallback

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-300px)] overflow-y-auto dark-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Courses</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              className="px-3 py-1 border rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-2 top-1.5 h-4 w-4 text-gray-400" />
          </div>
          <button
            onClick={() => onAdd?.()}  // Add optional chaining
            className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
      </div>

      <div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCourses.map((course) => (
              <tr key={course.id}>
                {editingCourse?.id === course.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        className="w-full px-2 py-1 border rounded"
                        value={editingCourse.courseName || ''}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            courseName: e.target.value
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full px-2 py-1 border rounded"
                        value={editingCourse.courseDescription || ''}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            courseDescription: e.target.value
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        value={editingCourse.credits || 0}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            credits: parseInt(e.target.value) || 0
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleUpdateCourse(editingCourse)}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        <Save className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => setEditingCourse(null)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {course.courseName}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-500">{course.courseDescription}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-500">{course.credits}</div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setEditingCourse(course)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuickCourses;