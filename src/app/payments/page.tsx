"use client";

import { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  QrCodeIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

type ClassType = {
  id: number;
  name: string;
};

type Student = {
  id: number;
  name: string;
  grade: string;
  classId: number;
  class: {
    id: number;
    name: string;
  };
};

type Payment = {
  id: number;
  studentId: number;
  student: Student;
  term: string;
  status: 'joined' | 'paid' | 'unpaid' | 'not_joined';
  amount: number;
  paymentMethod: 'wechat' | 'alipay' | 'bank' | null;
  paidAt: string | null;
};

const statusOptions = [
  { value: 'joined', label: '接龙参加', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'paid', label: '已缴费', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'unpaid', label: '未缴费', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'not_joined', label: '未接龙', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

const paymentMethodOptions = [
  { value: 'wechat', label: '微信', icon: QrCodeIcon },
  { value: 'alipay', label: '支付宝', icon: CreditCardIcon },
  { value: 'bank', label: '银行卡', icon: BanknotesIcon },
];

const termOptions = ['2026春季', '2026秋季', '2027春季', '2027秋季'];

export default function PaymentsPage() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showBulkCreate, setShowBulkCreate] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchPayments();
    }
  }, [selectedClassId, selectedTerm, selectedStatus]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('获取班级列表失败');
      const data = await response.json();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级列表失败');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('获取学生列表失败');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('获取学生列表失败:', err);
    }
  };

  const fetchPayments = async () => {
    if (!selectedClassId) return;

    try {
      setIsLoading(true);
      let url = `/api/payments?classId=${selectedClassId}`;
      if (selectedTerm) {
        url += `&term=${selectedTerm}`;
      }
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('获取缴费记录失败');
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缴费记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePayment = async (studentId: number) => {
    if (!selectedTerm) {
      setError('请先选择期次');
      return;
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          term: selectedTerm,
          status: 'joined',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建缴费记录失败');
      }

      fetchPayments();
      setSuccessMessage('缴费记录创建成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建缴费记录失败');
    }
  };

  const handleBulkCreate = async () => {
    if (!selectedClassId || !selectedTerm) {
      setError('请选择班级和期次');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');

      // 获取该班级的所有学生
      const classStudents = students.filter(student => student.classId === parseInt(selectedClassId));
      
      // 为每个学生创建缴费记录
      const promises = classStudents.map(student =>
        fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: student.id,
            term: selectedTerm,
            status: 'joined',
          }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(res => !res.ok);
      
      if (failed.length > 0) {
        throw new Error(`${failed.length}条记录创建失败`);
      }

      setSuccessMessage(`成功为 ${classStudents.length} 名学生创建缴费记录！`);
      fetchPayments();
      setShowBulkCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量创建失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePayment = async (paymentId: number, updates: Partial<Payment>) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }

      // 更新本地状态
      setPayments(payments.map(payment =>
        payment.id === paymentId ? { ...payment, ...updates } : payment
      ));

      setSuccessMessage('更新成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'joined':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'unpaid':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'not_joined':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    const option = paymentMethodOptions.find(opt => opt.value === method);
    if (option) {
      const Icon = option.icon;
      return <Icon className="h-5 w-5" />;
    }
    return null;
  };

  const getPaymentMethodText = (method: string | null) => {
    const option = paymentMethodOptions.find(opt => opt.value === method);
    return option?.label || '未选择';
  };

  const calculateStats = () => {
    const total = payments.length;
    const paid = payments.filter(p => p.status === 'paid').length;
    const totalAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
    return { total, paid, totalAmount };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">缴费管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理学生的缴费状态和收款信息
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowBulkCreate(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            批量创建记录
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-50 p-3">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总人数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-green-50 p-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已缴费</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.paid}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-purple-50 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">收款总额</p>
              <p className="text-2xl font-semibold text-gray-900">¥{stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选区 */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">
              选择班级
            </label>
            <select
              id="class-filter"
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
            <label htmlFor="term-filter" className="block text-sm font-medium text-gray-700">
              选择期次
            </label>
            <select
              id="term-filter"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">全部期次</option>
              {termOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              筛选状态
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">全部状态</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
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

      {/* 缴费列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
      ) : selectedClassId && payments.length > 0 ? (
        <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    学生
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    期次
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    金额
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    收款方式
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    缴费时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200"></div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{payment.student.name}</div>
                          <div className="text-sm text-gray-500">{payment.student.grade}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {payment.term}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        value={payment.status}
                        onChange={(e) => handleUpdatePayment(payment.id, { 
                          status: e.target.value as Payment['status'],
                          ...(e.target.value === 'paid' && !payment.amount ? { amount: 3000 } : {})
                        })}
                        className={`rounded-md border px-3 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          statusOptions.find(s => s.value === payment.status)?.color || ''
                        }`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        type="number"
                        value={payment.amount || ''}
                        onChange={(e) => handleUpdatePayment(payment.id, { 
                          amount: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="金额"
                        className="w-24 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        value={payment.paymentMethod || ''}
                        onChange={(e) => handleUpdatePayment(payment.id, { 
                          paymentMethod: (e.target.value || null) as Payment['paymentMethod'] 
                        })}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">选择方式</option>
                        {paymentMethodOptions.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          if (payment.status !== 'paid') {
                            handleUpdatePayment(payment.id, { 
                              status: 'paid',
                              paidAt: new Date().toISOString(),
                              amount: payment.amount || 3000,
                              paymentMethod: payment.paymentMethod || 'wechat'
                            });
                          }
                        }}
                        className={`rounded-md px-3 py-1 text-sm ${
                          payment.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                        }`}
                        disabled={payment.status === 'paid'}
                      >
                        {payment.status === 'paid' ? '已缴费' : '标记已缴费'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedClassId ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无缴费记录</h3>
          <p className="mt-1 text-sm text-gray-500">为该班级创建缴费记录</p>
          <button
            onClick={() => setShowBulkCreate(true)}
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            批量创建记录
          </button>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">请选择班级</h3>
          <p className="mt-1 text-sm text-gray-500">选择一个班级查看缴费记录</p>
        </div>
      )}

      {/* 批量创建弹窗 */}
      {showBulkCreate && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowBulkCreate(false)}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">批量创建缴费记录</h3>
                  <button
                    type="button"
                    onClick={() => setShowBulkCreate(false)}
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">关闭</span>
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-500">
                    将为 <span className="font-medium">{selectedClassId ? classes.find(c => c.id === parseInt(selectedClassId))?.name : '所选班级'}</span> 的所有学生创建缴费记录。
                  </p>
                  <div>
                    <label htmlFor="bulk-term" className="block text-sm font-medium text-gray-700">
                      选择期次 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="bulk-term"
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">请选择期次</option>
                      {termOptions.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">注意</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>创建后所有学生的初始状态为&quot;接龙参加&quot;。</p>
                          <p>您可以在列表中修改状态、金额和收款方式。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBulkCreate(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleBulkCreate}
                    disabled={isLoading || !selectedTerm}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        创建中...
                      </span>
                    ) : (
                      '确认创建'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
