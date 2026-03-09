"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import StudentForm from '../../components/StudentForm';

type ClassType = {
  id: number;
  name: string;
  grade: string;
  schedule: string;
};

type Student = {
  id: number;
  name: string;
  grade: string;
  parentPhone: string;
  classId: number;
};

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  
  const [classData, setClassData] = useState<ClassType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allClasses, setAllClasses] = useState<ClassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (classId) {
      fetchClassData();
      fetchClassStudents();
    }
  }, [classId]);

  useEffect(() => {
    fetchAllClasses();
  }, []);

  const fetchAllClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setAllClasses(data);
      }
    } catch (err) {
      console.error('获取班级列表失败:', err);
    }
  };

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      if (!response.ok) throw new Error('获取班级信息失败');
      const data = await response.json();
      setClassData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级信息失败');
    }
  };

  const fetchClassStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/students?classId=${classId}`);
      if (!response.ok) throw new Error('获取学生列表失败');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取学生列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
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
    setShowStudentForm(false);
    setEditingStudent(null);
    fetchClassStudents();
  };

  if (!classData && !isLoading) {
    return (
      <div className="text-center py-12">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">班级不存在</h3>
        <p className="mt-1 text-sm text-gray-500">请求的班级可能已被删除或不存在。</p>
        <div className="mt-6">
          <Link
            href="/classes"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            返回班级列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center">
        <Link
          href="/classes"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          返回班级列表
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {classData?.name || '加载中...'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            班级详情 - 管理该班级的学生信息
          </p>
        </div>
        <button
          onClick={() => setShowStudentForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          添加学生
        </button>
      </div>

      {/* 班级信息卡片 */}
      {classData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="rounded-md bg-indigo-50 p-3">
                <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">班级名称</p>
                <p className="text-lg font-semibold text-gray-900">{classData.name}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="rounded-md bg-blue-50 p-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">年级</p>
                <p className="text-lg font-semibold text-gray-900">{classData.grade}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="rounded-md bg-green-50 p-3">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">上课时间</p>
                <p className="text-lg font-semibold text-gray-900">{classData.schedule}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误消息 */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 学生列表 */}
      <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              学生列表 ({students.length}人)
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无学生</h3>
            <p className="mt-1 text-sm text-gray-500">开始为该班级添加学生吧！</p>
            <button
              onClick={() => setShowStudentForm(true)}
              className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              添加学生
            </button>
          </div>
        ) : (
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
                    家长电话
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <PhoneIcon className="mr-2 h-4 w-4 text-gray-400" />
                        {student.parentPhone}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setShowStudentForm(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          aria-label="编辑"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="删除"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 学生表单弹窗 */}
      {(showStudentForm || editingStudent) && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowStudentForm(false);
                setEditingStudent(null);
              }}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <StudentForm
                studentData={editingStudent || undefined}
                classes={allClasses}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setShowStudentForm(false);
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
