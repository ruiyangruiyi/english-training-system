"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 模拟数据
const stats = [
  { name: '班级总数', value: '12', icon: AcademicCapIcon, change: '+2', changeType: 'positive', href: '/classes' },
  { name: '学生总数', value: '156', icon: UserGroupIcon, change: '+8', changeType: 'positive', href: '/students' },
  { name: '今日出勤率', value: '94%', icon: CalendarIcon, change: '+2%', changeType: 'positive', href: '/attendances' },
  { name: '待缴费用', value: '¥8,240', icon: CurrencyDollarIcon, change: '-¥1,200', changeType: 'negative', href: '/payments' },
  { name: '待批作业', value: '42', icon: DocumentTextIcon, change: '+5', changeType: 'positive', href: '/homeworks' },
  { name: '整体满意度', value: '4.8/5.0', icon: DocumentCheckIcon, change: '+0.2', changeType: 'positive', href: '#' },
];

const recentActivities = [
  { id: 1, user: '张三', action: '提交了作业', target: 'Unit 5 作文', time: '5分钟前', color: 'bg-blue-500' },
  { id: 2, user: '李四', action: '缴费成功', target: '2026春季学期', time: '1小时前', color: 'bg-green-500' },
  { id: 3, user: '王五', action: '请假', target: '3月10日课程', time: '2小时前', color: 'bg-yellow-500' },
  { id: 4, user: '赵六', action: '加入了班级', target: '中级口语班', time: '3小时前', color: 'bg-purple-500' },
  { id: 5, user: '孙七', action: '作业被批改', target: 'Unit 4 阅读理解', time: '5小时前', color: 'bg-pink-500' },
];

const attendanceData = {
  labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  datasets: [
    {
      label: '出勤人数',
      data: [120, 125, 118, 130, 128, 110, 105],
      borderColor: 'rgb(79, 70, 229)',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderWidth: 2,
      tension: 0.4,
    },
  ],
};

const paymentData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
  datasets: [
    {
      label: '已缴费',
      data: [32000, 28000, 35000, 42000, 38000, 45000],
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
    },
    {
      label: '待缴费',
      data: [8000, 12000, 5000, 3000, 10000, 5000],
      backgroundColor: 'rgba(239, 68, 68, 0.7)',
    },
  ],
};

const classDistributionData = {
  labels: ['初级班', '中级班', '高级班', '口语班', '写作班'],
  datasets: [
    {
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        'rgba(79, 70, 229, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
    },
  ],
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('week');

  return (
    <div className="space-y-6">
      {/* 标题和筛选 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
          <p className="mt-1 text-sm text-gray-600">
            欢迎回来！以下是系统最新数据概览。
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="quarter">本季度</option>
            <option value="year">本年</option>
          </select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="rounded-md bg-indigo-50 p-3">
                <stat.icon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <div className={`ml-2 flex items-center text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.changeType === 'positive' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    <span className="ml-1">{stat.change}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 出勤趋势 */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">本周出勤趋势</h3>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              +5% 对比上周
            </span>
          </div>
          <div className="mt-6 h-72">
            <Line
              data={attendanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    grid: {
                      display: true,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* 缴费情况 */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">缴费情况统计</h3>
          <div className="mt-6 h-72">
            <Bar
              data={paymentData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `¥${value}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* 班级分布 */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">班级分布</h3>
          <div className="mt-6 flex h-72 items-center justify-center">
            <div className="h-64 w-64">
              <Pie
                data={classDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">最近活动</h3>
            <Link
              href="#"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              查看全部
            </Link>
          </div>
          <div className="mt-6 flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivities.length - 1 ? (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`${activity.color} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}
                        >
                          <span className="text-xs font-semibold text-white">
                            {activity.user.charAt(0)}
                          </span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.user}</span>{' '}
                            {activity.action}{' '}
                            <span className="font-medium">{activity.target}</span>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">快速操作</h3>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            href="/classes/create"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
          >
            <AcademicCapIcon className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-700">新建班级</span>
          </Link>
          <Link
            href="/students/create"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
          >
            <UserGroupIcon className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-700">添加学生</span>
          </Link>
          <Link
            href="/attendances"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
          >
            <CalendarIcon className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-700">记录考勤</span>
          </Link>
          <Link
            href="/payments"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-700">缴费管理</span>
          </Link>
          <Link
            href="/homeworks/create"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
          >
            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-700">布置作业</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
