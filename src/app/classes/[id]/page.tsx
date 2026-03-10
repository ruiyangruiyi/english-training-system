"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, UserGroupIcon,
  PhoneIcon, AcademicCapIcon, CalendarIcon, ChatBubbleLeftRightIcon,
  QrCodeIcon, BellIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import StudentForm from '../../components/StudentForm';

type ClassType = {
  id: number;
  name: string;
  grade: string;
  schedule: string;
  wechatGroupId?: string;
  wechatGroupName?: string;
};

type Student = {
  id: number;
  name: string;
  grade: string;
  parentPhone: string;
  classId: number;
};

type WechatGroupInfo = {
  groupId: string | null;
  groupName: string | null;
  qrCodeUrl: string | null;
  memberCount: number;
  reminderEnabled: boolean;
  reminderTime: string;
};

const tabs = [
  { id: 'students', name: '学生列表', icon: UserGroupIcon },
  { id: 'wechat', name: '微信群', icon: ChatBubbleLeftRightIcon },
];

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('students');
  const [classData, setClassData] = useState<ClassType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allClasses, setAllClasses] = useState<ClassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // 微信群相关状态
  const [wechatInfo, setWechatInfo] = useState<WechatGroupInfo>({
    groupId: null, groupName: null, qrCodeUrl: null, memberCount: 0,
    reminderEnabled: false, reminderTime: '20:00'
  });
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClassData();
      fetchClassStudents();
      fetchWechatInfo();
    }
  }, [classId]);

  useEffect(() => { fetchAllClasses(); }, []);

  const fetchAllClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) setAllClasses(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchClassData = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}`);
      if (!res.ok) throw new Error('获取班级信息失败');
      setClassData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
    }
  };

  const fetchClassStudents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/students?classId=${classId}`);
      if (!res.ok) throw new Error('获取学生列表失败');
      setStudents(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWechatInfo = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/wechat`);
      if (res.ok) {
        const data = await res.json();
        setWechatInfo(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('确定要删除这个学生吗？')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setStudents(students.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleFormSuccess = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    fetchClassStudents();
  };

  const saveReminderSettings = async () => {
    setSavingReminder(true);
    try {
      const res = await fetch(`/api/classes/${classId}/wechat/reminder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: wechatInfo.reminderEnabled,
          time: wechatInfo.reminderTime,
        }),
      });
      if (!res.ok) throw new Error('保存失败');
      alert('提醒设置已保存');
    } catch (err) {
      alert('保存失败');
    } finally {
      setSavingReminder(false);
    }
  };

  const generateQrCode = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/wechat/qrcode`, { method: 'POST' });
      if (!res.ok) throw new Error('生成失败');
      fetchWechatInfo();
    } catch (err) {
      alert('生成二维码失败');
    }
  };

  if (!classData && !isLoading) {
    return (
      <div className="text-center py-12">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">班级不存在</h3>
        <Link href="/classes" className="mt-4 inline-flex items-center text-indigo-600">
          <ArrowLeftIcon className="mr-2 h-5 w-5" />返回班级列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/classes" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-2 h-5 w-5" />返回班级列表
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{classData?.name || '加载中...'}</h1>
          <p className="mt-1 text-sm text-gray-600">{classData?.grade} · {classData?.schedule}</p>
        </div>
        <Link href={`/classes/${classId}/chat-analysis`}
          className="mt-4 sm:mt-0 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800">
          <ChatBubbleLeftRightIcon className="mr-1 h-5 w-5" />查看群聊分析
        </Link>
      </div>

      {/* Tab 切换 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <tab.icon className="mr-2 h-5 w-5" />{tab.name}
            </button>
          ))}
        </nav>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md">{error}</div>}

      {/* 学生列表 Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowStudentForm(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
              <PlusIcon className="mr-2 h-5 w-5" />添加学生
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无学生</h3>
                <button onClick={() => setShowStudentForm(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md">
                  <PlusIcon className="mr-2 h-5 w-5" />添加学生
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">年级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">家长电话</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.grade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <PhoneIcon className="inline mr-1 h-4 w-4" />{s.parentPhone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button onClick={() => { setEditingStudent(s); setShowStudentForm(true); }}
                          className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="h-5 w-5 inline" /></button>
                        <button onClick={() => handleDeleteStudent(s.id)}
                          className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 微信群 Tab */}
      {activeTab === 'wechat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 群二维码 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <QrCodeIcon className="h-5 w-5 mr-2" />群二维码
            </h3>
            {wechatInfo.qrCodeUrl ? (
              <div className="text-center">
                <img src={wechatInfo.qrCodeUrl} alt="群二维码" className="mx-auto w-48 h-48 border rounded-lg" />
                <p className="mt-2 text-sm text-gray-500">扫码加入班级群</p>
                <p className="text-xs text-gray-400">群成员：{wechatInfo.memberCount}人</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCodeIcon className="mx-auto h-16 w-16 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">暂未创建微信群</p>
                <button onClick={generateQrCode}
                  className="mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
                  创建微信群
                </button>
              </div>
            )}
          </div>

          {/* 群状态和提醒设置 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />提醒设置
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">群名称</p>
                  <p className="text-sm text-gray-500">{wechatInfo.groupName || '未创建'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  wechatInfo.groupId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {wechatInfo.groupId ? '已关联' : '未关联'}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">作业提醒</span>
                  </div>
                  <button onClick={() => setWechatInfo({ ...wechatInfo, reminderEnabled: !wechatInfo.reminderEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      wechatInfo.reminderEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      wechatInfo.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {wechatInfo.reminderEnabled && (
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">提醒时间</span>
                    <input type="time" value={wechatInfo.reminderTime}
                      onChange={(e) => setWechatInfo({ ...wechatInfo, reminderTime: e.target.value })}
                      className="rounded-md border-gray-300 text-sm" />
                  </div>
                )}

                <button onClick={saveReminderSettings} disabled={savingReminder}
                  className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {savingReminder ? '保存中...' : '保存设置'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学生表单弹窗 */}
      {(showStudentForm || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <StudentForm
              studentData={editingStudent || undefined}
              classes={allClasses}
              onSuccess={handleFormSuccess}
              onCancel={() => { setShowStudentForm(false); setEditingStudent(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
