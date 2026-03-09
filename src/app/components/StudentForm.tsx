"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type StudentData = {
  id?: number;
  name: string;
  grade: string;
  parentPhone: string;
  classId?: number;
};

type ClassType = {
  id: number;
  name: string;
};

type StudentFormProps = {
  studentData?: StudentData;
  classes: ClassType[];
  onSuccess: () => void;
  onCancel: () => void;
};

export default function StudentForm({ studentData, classes, onSuccess, onCancel }: StudentFormProps) {
  const isEditing = !!studentData?.id;
  const [formData, setFormData] = useState<StudentData>({
    name: studentData?.name || '',
    grade: studentData?.grade || '',
    parentPhone: studentData?.parentPhone || '',
    classId: studentData?.classId || (classes.length > 0 ? classes[0].id : undefined),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classes.length > 0 && !formData.classId) {
      setFormData(prev => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes, formData.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/students/${studentData.id}` : '/api/students';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '操作失败');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  const gradeOptions = [
    '幼儿园', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
    '初一', '初二', '初三', '高一', '高二', '高三', '成人'
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? '编辑学生' : '新增学生'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-white text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            学生姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            placeholder="请输入学生姓名"
          />
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
            年级 <span className="text-red-500">*</span>
          </label>
          <select
            id="grade"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">请选择年级</option>
            {gradeOptions.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">
            家长电话 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="parentPhone"
            value={formData.parentPhone}
            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
            required
            pattern="[0-9]{11}"
            maxLength={11}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            placeholder="请输入11位手机号码"
          />
          <p className="mt-1 text-xs text-gray-500">请输入11位手机号码</p>
        </div>

        <div>
          <label htmlFor="classId" className="block text-sm font-medium text-gray-700">
            所属班级
          </label>
          <select
            id="classId"
            value={formData.classId || ''}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value ? parseInt(e.target.value) : undefined })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">未分配班级</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </span>
            ) : (
              '保存'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
