import React, { useState } from 'react';
import { Plus, Search, X, Save } from 'lucide-react';

const QuickStudents = ({ students, onUpdate, onAdd }) => {
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpdateStudent = async (updatedStudent) => {
    await onUpdate(updatedStudent);
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-300px)] overflow-y-auto dark-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Students</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search students..."
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
                Email
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                {editingStudent?.id === student.id ? (
                  <>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <input
                          className="w-20 px-2 py-1 border rounded"
                          value={editingStudent.firstName}
                          onChange={(e) =>
                            setEditingStudent({
                              ...editingStudent,
                              firstName: e.target.value
                            })
                          }
                        />
                        <input
                          className="w-20 px-2 py-1 border rounded"
                          value={editingStudent.lastName}
                          onChange={(e) =>
                            setEditingStudent({
                              ...editingStudent,
                              lastName: e.target.value
                            })
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full px-2 py-1 border rounded"
                        value={editingStudent.email}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            email: e.target.value
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleUpdateStudent(editingStudent)}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        <Save className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => setEditingStudent(null)}
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
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setEditingStudent(student)}
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

export default QuickStudents;