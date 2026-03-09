"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import StudentForm from '../components/StudentForm';

type Student = {
  id: number;
  name: string;
  grade: string;
  parentPhone: string;
  classId: number;
  class: {
    id: number;
    name: string;
    teacher?: { id: number; name: string };
  };
};

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user !== null) {
      fetchData();
    }
  }, [filterClassId, user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 获取班级列表
      const classParams = new URLSearchParams();
      if (user) {
        classParams.set('role', user.role);
        if (user.role !== 'admin') {
          classParams.set('teacherId', user.id.toString());
        }
      }
      const classesRes = await fetch(`/api/classes?${classParams}`);
      if (!classesRes.ok) throw new Error('获取班级列表失败');
      const classesData = await classesRes.json();
      setClasses(classesData);

      // 获取学生列表
      const studentParams = new URLSearchParams();
      if (filterClassId) {
        studentParams.set('classId', filterClassId);
      } else if (user) {
        studentParams.set('role', user.role);
        if (user.role !== 'admin') {
          studentParams.set('teacherId', user.id.toString());
        }
      }
      const studentsRes = await fetch(`/api/students?${studentParams}`);
      if (!studentsRes.ok) throw new Error('获取学生列表失败');
      const studentsData = await studentsRes.json();
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个学生吗？这将删除该学生的所有考勤和缴费记录。')) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');
      
      setStudents(students.filter(student => student.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingStudent(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理所有学生信息，包括姓名、年级和家长联系方式
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          新增学生
        </button>
      </div>

      {/* 筛选 */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div>
          <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">
            按班级筛选
          </label>
          <select
            id="class-filter"
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">全部班级</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无学生</h3>
          <p className="mt-1 text-sm text-gray-500">开始创建第一个学生吧！</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            新增学生
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{student.grade}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingStudent(student);
                      setShowForm(true);
                    }}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                    aria-label="编辑"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="rounded-full p-1 text-gray-400 hover:text-red-600"
                    aria-label="删除"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="mr-2 h-4 w-4 text-gray-400" />
                  <span>{student.parentPhone}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <AcademicCapIcon className="mr-2 h-4 w-4 text-gray-400" />
                  <Link
                    href={`/classes/${student.classId}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {student.class.name}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 学生表单弹窗 */}
      {(showForm || editingStudent) && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowForm(false);
                setEditingStudent(null);
              }}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <StudentForm
                studentData={editingStudent || undefined}
                classes={classes}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingStudent(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
