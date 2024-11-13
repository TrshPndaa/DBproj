import React, { useState } from 'react';
import { Plus, Search, X, Save } from 'lucide-react';

const QuickTeachers = ({ teachers, onUpdate, onAdd }) => {
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpdateTeacher = async (updatedTeacher) => {
    await onUpdate(updatedTeacher);
    setEditingTeacher(null);
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-300px)] overflow-y-auto dark-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Teachers</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search teachers..."
              className="px-3 py-1 border rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-2 top-1.5 h-4 w-4 text-gray-400" />
          </div>
          <button
            onClick={onAdd}
            className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTeachers.map((teacher) => (
              <tr key={teacher.id}>
                {editingTeacher?.id === teacher.id ? (
                  <>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <input
                          className="w-20 px-2 py-1 border rounded"
                          value={editingTeacher.firstName}
                          onChange={(e) =>
                            setEditingTeacher({
                              ...editingTeacher,
                              firstName: e.target.value
                            })
                          }
                        />
                        <input
                          className="w-20 px-2 py-1 border rounded"
                          value={editingTeacher.lastName}
                          onChange={(e) =>
                            setEditingTeacher({
                              ...editingTeacher,
                              lastName: e.target.value
                            })
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full px-2 py-1 border rounded"
                        value={editingTeacher.department}
                        onChange={(e) =>
                          setEditingTeacher({
                            ...editingTeacher,
                            department: e.target.value
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleUpdateTeacher(editingTeacher)}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        <Save className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => setEditingTeacher(null)}
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
                        {teacher.firstName} {teacher.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-500">
                        {teacher.department}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setEditingTeacher(teacher)}
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

export default QuickTeachers;