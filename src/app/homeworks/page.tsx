"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  CheckIcon,
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
  classes: ClassType[];
};

export default function HomeworksPage() {
  const [tab, setTab] = useState<'create' | 'list'>('create');
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    dueDate: '',
  });
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchHomeworks();
  }, [filterClassId]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('获取班级列表失败');
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级列表失败');
    }
  };

  const fetchHomeworks = async () => {
    try {
      setIsLoading(true);
      let url = '/api/homeworks';
      if (filterClassId) {
        url += `?classId=${filterClassId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('获取作业列表失败');
      const data = await response.json();
      setHomeworks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作业列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassToggle = (classId: number) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.title.trim()) {
      setError('请填写作业标题');
      return;
    }

    if (!formData.content.trim()) {
      setError('请填写作业内容');
      return;
    }

    if (!formData.dueDate) {
      setError('请选择截止日期');
      return;
    }

    if (selectedClassIds.length === 0) {
      setError('请至少选择一个班级');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/homeworks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          classIds: selectedClassIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建作业失败');
      }

      setSuccessMessage('作业创建成功！');
      setFormData({ title: '', content: '', dueDate: '' });
      setSelectedClassIds([]);
      fetchHomeworks();
      setTab('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建作业失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个作业吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/homeworks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');
      
      setHomeworks(homeworks.filter(hw => hw.id !== id));
      setSuccessMessage('作业删除成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const generateNotificationText = () => {
    if (!formData.title || !formData.content || !formData.dueDate || selectedClassIds.length === 0) {
      return '';
    }

    const selectedClasses = classes.filter(cls => selectedClassIds.includes(cls.id));
    const classNames = selectedClasses.map(cls => cls.name).join('、');
    const formattedDate = new Date(formData.dueDate).toLocaleDateString('zh-CN');

    return `【${classNames}作业通知】
📚 作业：${formData.title}
📝 内容：${formData.content}
⏰ 截止：${formattedDate}
请同学们按时完成！`;
  };

  const handleCopyNotification = async () => {
    const text = generateNotificationText();
    if (!text) {
      setError('请先填写作业信息并选择班级');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setSuccessMessage('文案已复制到剪贴板！');
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      setError('复制失败，请手动复制文本');
    }
  };

  const notificationText = generateNotificationText();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">作业管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            创建和分发作业，生成通知文案
          </p>
        </div>
      </div>

      {/* 选项卡 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'create'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            创建作业
          </button>
          <button
            onClick={() => setTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'list'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            作业列表
          </button>
        </nav>
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

      {/* 创建作业表单 */}
      {tab === 'create' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">作业信息</h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    作业标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="例如：Unit 5 阅读理解"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    作业内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="请输入详细的作业要求和说明..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    截止日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择班级 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleClassToggle(cls.id)}
                        className={`flex items-center rounded-lg border px-4 py-3 text-sm font-medium ${
                          selectedClassIds.includes(cls.id)
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <AcademicCapIcon className="mr-2 h-5 w-5" />
                        {cls.name}
                        {selectedClassIds.includes(cls.id) && (
                          <CheckIcon className="ml-auto h-5 w-5 text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedClassIds.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      已选择 {selectedClassIds.length} 个班级
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        创建中...
                      </span>
                    ) : (
                      <>
                        <DocumentTextIcon className="mr-2 h-5 w-5" />
                        创建作业
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyNotification}
                    disabled={!notificationText}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    {copySuccess ? (
                      <>
                        <CheckIcon className="mr-2 h-5 w-5 text-green-600" />
                        已复制
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="mr-2 h-5 w-5" />
                        生成文案并复制
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 预览区 */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">通知文案预览</h3>
              <div className="mt-4">
                {notificationText ? (
                  <div className="rounded-md bg-gray-50 p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                      {notificationText}
                    </pre>
                    <p className="mt-4 text-sm text-gray-500">
                      点击"生成文案并复制"按钮将此文案复制到剪贴板，可直接发送给家长群。
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">文案预览</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      填写作业信息后，这里会显示生成的通知文案
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 作业列表 */}
      {tab === 'list' && (
        <div className="space-y-4">
          {/* 筛选 */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">作业列表</h3>
                <p className="mt-1 text-sm text-gray-600">
                  查看和管理所有已创建的作业
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <select
                  value={filterClassId}
                  onChange={(e) => setFilterClassId(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            </div>
          ) : homeworks.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无作业</h3>
              <p className="mt-1 text-sm text-gray-500">开始创建第一个作业吧！</p>
              <button
                onClick={() => setTab('create')}
                className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                创建作业
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {homeworks.map((homework) => (
                <div
                  key={homework.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="rounded-md bg-indigo-50 p-2">
                          <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{homework.title}</h3>
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
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {homework.content}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>截止日期：{new Date(homework.dueDate).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div>
                          <span>创建时间：{new Date(homework.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(homework.id)}
                      className="ml-4 rounded-full p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      aria-label="删除作业"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
