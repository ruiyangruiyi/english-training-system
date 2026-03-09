"use client";

import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type ClassType = {
  id: number;
  name: string;
};

type Student = {
  id: number;
  name: string;
  grade: string;
};

type AttendanceRecord = {
  id: number;
  studentId: number;
  date: string;
  status: 'present' | 'leave' | 'absent';
};

type AttendanceRecordInput = {
  studentId: number;
  status: 'present' | 'leave' | 'absent';
};

export default function AttendancesPage() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassStudents();
    } else {
      setStudents([]);
      setAttendanceRecords([]);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchAttendanceRecords();
    }
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('获取班级列表失败');
      const data = await response.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级列表失败');
    }
  };

  const fetchClassStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/students?classId=${selectedClassId}`);
      if (!response.ok) throw new Error('获取学生列表失败');
      const data = await response.json();
      setStudents(data);
      
      // 初始化考勤记录
      const initialRecords = data.map((student: Student) => ({
        studentId: student.id,
        status: 'present' as const,
      }));
      setAttendanceRecords(initialRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取学生列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    if (!selectedClassId || !selectedDate) return;

    try {
      const response = await fetch(
        `/api/attendances?classId=${selectedClassId}&date=${selectedDate}`
      );
      if (!response.ok) throw new Error('获取考勤记录失败');
      const data = await response.json();
      
      if (data.length > 0) {
        // 使用已有的考勤记录
        const records = students.map(student => {
          const existing = data.find((att: AttendanceRecord) => att.studentId === student.id);
          return {
            studentId: student.id,
            status: existing ? existing.status : 'present',
          };
        });
        setAttendanceRecords(records);
      }
    } catch (err) {
      // 如果没有考勤记录，忽略错误
      console.log('没有考勤记录');
    }
  };

  const handleStatusChange = (studentId: number, status: 'present' | 'leave' | 'absent') => {
    setAttendanceRecords(records =>
      records.map(record =>
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };

  const handleBulkStatus = (status: 'present' | 'leave' | 'absent') => {
    setAttendanceRecords(records =>
      records.map(record => ({ ...record, status }))
    );
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedDate) {
      setError('请选择班级和日期');
      return;
    }

    if (attendanceRecords.length === 0) {
      setError('没有学生记录');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: parseInt(selectedClassId),
          date: selectedDate,
          records: attendanceRecords,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存失败');
      }

      setSuccessMessage('考勤记录保存成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'leave':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return '出勤';
      case 'leave': return '请假';
      case 'absent': return '缺勤';
      default: return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'leave': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">考勤管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            记录和查看学生的出勤情况
          </p>
        </div>
      </div>

      {/* 筛选区 */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">
              选择班级
            </label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">请选择班级</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-select" className="block text-sm font-medium text-gray-700">
              选择日期
            </label>
            <div className="relative mt-1">
              <input
                type="date"
                id="date-select"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              />
              <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 批量操作 */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">批量操作</h3>
            <p className="mt-1 text-sm text-gray-600">快速设置所有学生的考勤状态</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => handleBulkStatus('present')}
              className="inline-flex items-center rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200"
            >
              <CheckCircleIcon className="mr-2 h-5 w-5" />
              全部出勤
            </button>
            <button
              onClick={() => handleBulkStatus('leave')}
              className="inline-flex items-center rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-200"
            >
              <ClockIcon className="mr-2 h-5 w-5" />
              全部请假
            </button>
            <button
              onClick={() => handleBulkStatus('absent')}
              className="inline-flex items-center rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
            >
              <XCircleIcon className="mr-2 h-5 w-5" />
              全部缺勤
            </button>
          </div>
        </div>
      </div>

      {/* 错误和成功消息 */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 学生考勤列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
      ) : selectedClassId && students.length > 0 ? (
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    学生姓名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    年级
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    考勤状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.map((student) => {
                  const record = attendanceRecords.find(r => r.studentId === student.id);
                  const status = record?.status || 'present';
                  return (
                    <tr key={student.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200"></div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{student.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {student.grade}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getStatusClass(status)}`}>
                          {getStatusIcon(status)}
                          <span className="ml-2">{getStatusText(status)}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`rounded-md px-3 py-1 text-sm ${
                              status === 'present'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            出勤
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'leave')}
                            className={`rounded-md px-3 py-1 text-sm ${
                              status === 'leave'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            请假
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`rounded-md px-3 py-1 text-sm ${
                              status === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            缺勤
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedClassId || students.length === 0}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <CheckIcon className="mr-2 h-5 w-5" />
              {isSaving ? '保存中...' : '保存考勤记录'}
            </button>
            <p className="mt-2 text-sm text-gray-500">
              共 {students.length} 名学生，{attendanceRecords.filter(r => r.status === 'present').length} 人出勤
            </p>
          </div>
        </div>
      ) : selectedClassId ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">班级暂无学生</h3>
          <p className="mt-1 text-sm text-gray-500">请先在该班级中添加学生</p>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">请选择班级</h3>
          <p className="mt-1 text-sm text-gray-500">选择一个班级开始记录考勤</p>
        </div>
      )}
    </div>
  );
}
