"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

type ClassType = {
  id: number;
  name: string;
};

type Homework = {
  id: number;
  title: string;
  content: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  classes: ClassType[];
  source?: 'manual' | 'wechat';
  originalMessage?: string;
};

export default function HomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const homeworkId = params.id as string;

  const [homework, setHomework] = useState<Homework | null>(null);
  const [allClasses, setAllClasses] = useState<ClassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    dueDate: '',
    classIds: [] as number[],
  });

  useEffect(() => {
    fetchHomework();
    fetchClasses();
  }, [homeworkId]);

  const fetchHomework = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/homeworks/${homeworkId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('作业不存在');
          return;
        }
        throw new Error('获取作业详情失败');
      }
      const data = await response.json();
      
      const normalized: Homework = {
        id: data.id,
        title: data.title,
        content: data.content,
        dueDate: data.dueDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        classes: Array.isArray(data.homeworkClasses)
          ? data.homeworkClasses.map((hc: { class: ClassType }) => hc.class).filter(Boolean)
          : Array.isArray(data.classes) ? data.classes : [],
        source: data.source || 'manual',
        originalMessage: data.originalMessage,
      };
      
      setHomework(normalized);
      setEditForm({
        title: normalized.title,
        content: normalized.content,
        dueDate: normalized.dueDate.split('T')[0],
        classIds: normalized.classes.map(c => c.id),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作业详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('获取班级列表失败');
      const data = await response.json();
      setAllClasses(data);
    } catch (err) {
      console.error('获取班级列表失败:', err);
    }
  };

  const handleClassToggle = (classId: number) => {
    setEditForm(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId],
    }));
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) {
      setError('请填写作业标题');
      return;
    }
    if (!editForm.content.trim()) {
      setError('请填写作业内容');
      return;
    }
    if (!editForm.dueDate) {
      setError('请选择截止日期');
      return;
    }
    if (editForm.classIds.length === 0) {
      setError('请至少选择一个班级');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const response = await fetch(`/api/homeworks/${homeworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新作业失败');
      }

      setSuccessMessage('作业更新成功！');
      setIsEditing(false);
      fetchHomework();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新作业失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个作业吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/homeworks/${homeworkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');
      
      router.push('/homeworks');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleCancelEdit = () => {
    if (homework) {
      setEditForm({
        title: homework.title,
        content: homework.content,
        dueDate: homework.dueDate.split('T')[0],
        classIds: homework.classes.map(c => c.id),
      });
    }
    setIsEditing(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !homework) {
    return (
      <div className="space-y-6">
        <Link
          href="/homeworks"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          返回作业列表
        </Link>
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!homework) return null;

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Link
          href="/homeworks"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          返回作业列表
        </Link>
        
        {!isEditing && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              删除
            </button>
          </div>
        )}
      </div>

      {/* 消息提示 */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* 作业详情卡片 */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="p-6">
          {isEditing ? (
            /* 编辑模式 */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  作业标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  作业内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  截止日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择班级 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {allClasses.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => handleClassToggle(cls.id)}
                      className={`flex items-center rounded-lg border px-4 py-3 text-sm font-medium ${
                        editForm.classIds.includes(cls.id)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <AcademicCapIcon className="mr-2 h-5 w-5" />
                      {cls.name}
                      {editForm.classIds.includes(cls.id) && (
                        <CheckIcon className="ml-auto h-5 w-5 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <XMarkIcon className="mr-2 h-4 w-4" />
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="mr-2 h-4 w-4" />
                      保存
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* 查看模式 */
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="rounded-lg bg-indigo-50 p-3">
                  <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{homework.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {homework.classes.map((cls) => (
                      <span
                        key={cls.id}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                      >
                        <AcademicCapIcon className="mr-1 h-4 w-4" />
                        {cls.name}
                      </span>
                    ))}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      homework.source === 'wechat' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {homework.source === 'wechat' ? '微信同步' : '手动录入'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">作业内容</h3>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{homework.content}</p>
                </div>
              </div>

              {homework.source === 'wechat' && homework.originalMessage && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">原始微信消息</h3>
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{homework.originalMessage}</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">截止日期</p>
                    <p className="font-medium text-gray-900">
                      {new Date(homework.dueDate).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">创建时间</p>
                    <p className="font-medium text-gray-900">
                      {new Date(homework.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">更新时间</p>
                    <p className="font-medium text-gray-900">
                      {new Date(homework.updatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
