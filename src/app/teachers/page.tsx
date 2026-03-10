"use client";

import { useState, useEffect } from 'react';

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

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (!res.ok) throw new Error('获取老师列表失败');
      const data = await res.json();
      setTeachers(data);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">待审核</span>;
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">已启用</span>;
      case 'disabled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">已禁用</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>
      )}

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
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">暂无老师数据</td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.wechat || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.subject || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(teacher.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {teacher.status === 'pending' && (
                      <button onClick={() => updateStatus(teacher.id, 'active')}
                        className="text-green-600 hover:text-green-900 font-medium">审核通过</button>
                    )}
                    {teacher.status === 'active' && (
                      <button onClick={() => updateStatus(teacher.id, 'disabled')}
                        className="text-red-600 hover:text-red-900 font-medium">禁用</button>
                    )}
                    {teacher.status === 'disabled' && (
                      <button onClick={() => updateStatus(teacher.id, 'active')}
                        className="text-green-600 hover:text-green-900 font-medium">重新启用</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
