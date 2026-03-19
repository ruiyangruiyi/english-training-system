"use client";

import { useState, useEffect } from 'react';
import { UserGroupIcon, LinkIcon, XMarkIcon, QrCodeIcon } from '@heroicons/react/24/outline';

type CustomerGroup = {
  chatId: string;
  name: string;
  memberCount: number;
  boundClass: { id: number; name: string } | null;
};

type ClassInfo = {
  id: number;
  name: string;
};

export default function EduCustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [bindingGroup, setBindingGroup] = useState<CustomerGroup | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [binding, setBinding] = useState(false);
  const [qrcodeGroup, setQrcodeGroup] = useState<CustomerGroup | null>(null);
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [loadingQrcode, setLoadingQrcode] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchClasses();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/edu/api/customer-groups', { credentials: 'include' });
      if (!res.ok) throw new Error('获取客户群列表失败');
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups || []);
      } else {
        throw new Error(data.error || '获取失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/edu/api/classes', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  const handleBind = async () => {
    if (!bindingGroup || !selectedClassId) return;
    setBinding(true);
    try {
      const cls = classes.find((c) => c.id === selectedClassId);
      const res = await fetch(`/edu/api/classes/${selectedClassId}/bindgroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          wechatGroupId: bindingGroup.chatId,
          wechatGroupName: bindingGroup.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '绑定失败');
      setGroups((prev) =>
        prev.map((g) =>
          g.chatId === bindingGroup.chatId
            ? { ...g, boundClass: { id: selectedClassId, name: cls?.name || '' } }
            : g
        )
      );
      setBindingGroup(null);
      setSelectedClassId('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '绑定失败');
    } finally {
      setBinding(false);
    }
  };

  const handleUnbind = async (group: CustomerGroup) => {
    if (!group.boundClass) return;
    if (!confirm(`确定要解除「${group.name}」与「${group.boundClass.name}」的关联吗？`)) return;
    try {
      const res = await fetch(`/edu/api/classes/${group.boundClass.id}/bindgroup`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解绑失败');
      setGroups((prev) =>
        prev.map((g) => (g.chatId === group.chatId ? { ...g, boundClass: null } : g))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '解绑失败');
    }
  };

  const handleGetQrcode = async (group: CustomerGroup) => {
    setQrcodeGroup(group);
    setQrcodeUrl('');
    setLoadingQrcode(true);
    try {
      const res = await fetch(
        `/edu/api/classes/${group.boundClass?.id}/wechat-qrcode`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.qrcodeUrl) {
        setQrcodeUrl(data.qrcodeUrl);
      } else {
        setQrcodeUrl('无法获取二维码：' + (data.error || '未知错误'));
      }
    } catch {
      setQrcodeUrl('获取失败');
    } finally {
      setLoadingQrcode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户群管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理企业微信客户群与班级的关联关系
          </p>
        </div>
        <button
          onClick={fetchGroups}
          className="mt-4 sm:mt-0 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <UserGroupIcon className="mr-2 h-5 w-5" />
          刷新列表
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
      ) : groups.length === 0 ? (
        /* 空状态 */
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无客户群</h3>
          <p className="mt-1 text-sm text-gray-500">在企业微信中创建客户群后，这里将显示列表</p>
        </div>
      ) : (
        /* 客户群列表 */
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    群名称
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    群ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    成员数
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    关联班级
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {groups.map((group) => (
                  <tr key={group.chatId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{group.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {group.chatId}
                      </code>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {group.memberCount} 人
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {group.boundClass ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          <LinkIcon className="mr-1 h-3 w-3" />
                          {group.boundClass.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">未关联</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {group.boundClass ? (
                          <>
                            <button
                              onClick={() => handleGetQrcode(group)}
                              className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                              title="获取群二维码"
                            >
                              <QrCodeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleUnbind(group)}
                              className="inline-flex items-center text-red-600 hover:text-red-900"
                              title="解除关联"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setBindingGroup(group);
                              setSelectedClassId('');
                            }}
                            className="inline-flex items-center rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                          >
                            <LinkIcon className="mr-1 h-3 w-3" />
                            关联班级
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 绑定弹窗 */}
      {bindingGroup && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setBindingGroup(null)}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6 sm:align-middle">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  关联班级
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  将客户群「<strong>{bindingGroup.name}</strong>」关联到：
                </p>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value) || '')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">选择班级...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  onClick={() => setBindingGroup(null)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleBind}
                  disabled={!selectedClassId || binding}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {binding ? '绑定中...' : '确认绑定'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 二维码弹窗 */}
      {qrcodeGroup && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setQrcodeGroup(null)}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 sm:align-middle">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  群二维码
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {qrcodeGroup.name}
                  {qrcodeGroup.boundClass && (
                    <span className="ml-2 text-indigo-600">（{qrcodeGroup.boundClass.name}）</span>
                  )}
                </p>
                {loadingQrcode ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                  </div>
                ) : qrcodeUrl.startsWith('http') ? (
                  <div className="text-center">
                    <img
                      src={qrcodeUrl}
                      alt="群二维码"
                      className="mx-auto max-h-64 rounded-lg border border-gray-200"
                    />
                    <p className="mt-2 text-xs text-gray-500">扫码即可加入群聊</p>
                  </div>
                ) : (
                  <p className="text-sm text-red-500">{qrcodeUrl}</p>
                )}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setQrcodeGroup(null)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
