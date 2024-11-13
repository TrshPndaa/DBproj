import React from 'react';
import { Users, BookOpen, School, Calendar } from 'lucide-react';

const StatsOverview = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Students',
      value: stats.students,
      icon: Users,
      color: 'bg-blue-500',
      increase: '12%',
      trendDirection: 'up',
    },
    {
      title: 'Total Teachers',
      value: stats.teachers,
      icon: School,
      color: 'bg-green-500',
      increase: '5%',
      trendDirection: 'up',
    },
    {
      title: 'Active Courses',
      value: stats.courses,
      icon: BookOpen,
      color: 'bg-purple-500',
      increase: '8%',
      trendDirection: 'up',
    },
    {
      title: "Today's Attendance",
      value: `${stats.attendance}%`,
      icon: Calendar,
      color: 'bg-orange-500',
      increase: '3%',
      trendDirection: 'down',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    stat.trendDirection === 'up'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.trendDirection === 'up' ? '▲' : '▼'} {stat.increase} from last month
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div
                  className={`h-2 ${stat.color} rounded-full`}
                  style={{ width: stat.increase }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;
