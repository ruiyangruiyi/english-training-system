"use client";

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

type Teacher = {
  id: number;
  username: string;
  name: string;
  phone: string | null;
  wechat: string | null;
  subject: string | null;
  status: string;
  role: string;
};

type TeacherForm = {
  id?: number;
  username: string;
  password: string;
  name: string;
  phone: string;
  wechat: string;
  subject: string;
};

const emptyForm: TeacherForm = {
  username: '', password: '', name: '', phone: '', wechat: '', subject: ''
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (!res.ok) throw new Error('获取老师列表失败');
      setTeachers(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('更新失败');
      fetchTeachers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  };

  const openAddModal = () => {
    setEditingTeacher(emptyForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher({
      id: teacher.id,
      username: teacher.username,
      password: '',
      name: teacher.name,
      phone: teacher.phone || '',
      wechat: teacher.wechat || '',
      subject: teacher.subject || '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingTeacher.name || !editingTeacher.username) {
      alert('姓名和用户名不能为空');
      return;
    }
    if (!isEditing && !editingTeacher.password) {
      alert('新增老师必须设置密码');
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/teachers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTeacher),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }
      setShowModal(false);
      fetchTeachers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      disabled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: '待审核', active: '已启用', disabled: '已禁用'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">老师管理</h1>
          <p className="mt-1 text-sm text-gray-600">管理系统中的老师账号</p>
        </div>
        <button onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <PlusIcon className="h-5 w-5 mr-2" />新增老师
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">手机号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">微信</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">科目</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">暂无老师数据</td></tr>
            ) : (
              teachers.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.wechat || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.subject || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(t.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button onClick={() => openEditModal(t)} className="text-indigo-600 hover:text-indigo-900">
                      <PencilIcon className="h-4 w-4 inline" /> 编辑
                    </button>
                    {t.status === 'pending' && (
                      <button onClick={() => updateStatus(t.id, 'active')} className="text-green-600 hover:text-green-900">审核通过</button>
                    )}
                    {t.status === 'active' && (
                      <button onClick={() => updateStatus(t.id, 'disabled')} className="text-red-600 hover:text-red-900">禁用</button>
                    )}
                    {t.status === 'disabled' && (
                      <button onClick={() => updateStatus(t.id, 'active')} className="text-green-600 hover:text-green-900">启用</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">{isEditing ? '编辑老师' : '新增老师'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">姓名 *</label>
                <input type="text" value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">用户名 *</label>
                <input type="text" value={editingTeacher.username} disabled={isEditing}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{isEditing ? '新密码（留空不修改）' : '密码 *'}</label>
                <input type="password" value={editingTeacher.password}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">手机号</label>
                <input type="tel" value={editingTeacher.phone}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">微信号</label>
                <input type="text" value={editingTeacher.wechat}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, wechat: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">教授科目</label>
                <input type="text" value={editingTeacher.subject}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">取消</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
