"use client";

import { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type ClassType = { id: number; name: string };
type Student = { id: number; name: string; grade: string };
type AttendanceRecord = { studentId: number; status: 'present' | 'leave' | 'absent'; remark?: string };
interface User { id: number; role: string }

export default function AttendancesPage() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [savedRecords, setSavedRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => { if (user) fetchClasses(); }, [user]);
  useEffect(() => {
    if (selectedClassId) fetchClassStudents();
    else { setStudents([]); setAttendanceRecords([]); setSavedRecords([]); }
  }, [selectedClassId]);
  useEffect(() => {
    if (selectedClassId && selectedDate && students.length > 0) fetchAttendanceRecords();
  }, [selectedClassId, selectedDate, students]);

  const fetchClasses = async () => {
    try {
      const params = new URLSearchParams();
      if (user) {
        params.set('role', user.role);
        if (user.role !== 'admin') params.set('teacherId', user.id.toString());
      }
      const res = await fetch(`/api/classes?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `请求失败: ${res.status}`);
        setClasses([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setClasses(data);
        if (data.length > 0 && !selectedClassId) setSelectedClassId(data[0].id.toString());
      } else {
        setClasses([]);
        setError(data.error || '获取班级列表失败');
      }
    } catch (err) { setError('获取班级列表失败'); }
  };

  const fetchClassStudents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        setStudents([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
        const initial = data.map((s: Student) => ({ studentId: s.id, status: 'present' as const, remark: '' }));
        setAttendanceRecords(initial);
        setSavedRecords(JSON.parse(JSON.stringify(initial)));
      } else {
        setStudents([]);
      }
    } catch (err) { setError('获取学生列表失败'); }
    finally { setIsLoading(false); }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const res = await fetch(`/api/attendances?classId=${selectedClassId}&date=${selectedDate}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const records = students.map(s => {
          const existing = data.find((a: any) => a.studentId === s.id);
          return { studentId: s.id, status: existing?.status || 'present', remark: existing?.remark || '' };
        });
        setAttendanceRecords(records);
        setSavedRecords(JSON.parse(JSON.stringify(records)));
      } else {
        const initial = students.map(s => ({ studentId: s.id, status: 'present' as const, remark: '' }));
        setAttendanceRecords(initial);
        setSavedRecords(JSON.parse(JSON.stringify(initial)));
      }
    } catch (_err) {}
  };

  const hasChanges = () => JSON.stringify(attendanceRecords) !== JSON.stringify(savedRecords);

  const handleStatusChange = (studentId: number, status: 'present' | 'leave' | 'absent') => {
    setAttendanceRecords(records => records.map(r => 
      r.studentId === studentId ? { ...r, status, remark: status === 'present' ? '' : r.remark } : r
    ));
    setSuccessMessage('');
  };

  const handleRemarkChange = (studentId: number, remark: string) => {
    setAttendanceRecords(records => records.map(r => r.studentId === studentId ? { ...r, remark } : r));
  };

  const handleBulkStatus = (status: 'present' | 'leave' | 'absent') => {
    setAttendanceRecords(records => records.map(r => ({ ...r, status, remark: status === 'present' ? '' : r.remark })));
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    if (!hasChanges()) { setError(''); setSuccessMessage('没有修改'); return; }
    try {
      setIsSaving(true); setError(''); setSuccessMessage('');
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: parseInt(selectedClassId), date: selectedDate, records: attendanceRecords }),
      });
      if (!res.ok) throw new Error('保存失败');
      setSavedRecords(JSON.parse(JSON.stringify(attendanceRecords)));
      setShowModal(true);
    } catch (err) { setError('保存失败'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-medium">保存成功</h3>
              <p className="mt-2 text-sm text-gray-500">考勤记录已保存</p>
              <button onClick={() => setShowModal(false)} className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">确定</button>
            </div>
          </div>
        </div>
      )}

      <div><h1 className="text-2xl font-bold text-gray-900">考勤管理</h1></div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">选择班级</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
              <option value="">请选择班级</option>
              {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">选择日期</label>
            <div className="mt-1 flex items-center space-x-2">
              <button onClick={() => changeDate(-1)} className="rounded-md border p-2 hover:bg-gray-50"><ChevronLeftIcon className="h-5 w-5" /></button>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="block w-full rounded-md border px-3 py-2" />
              <button onClick={() => changeDate(1)} className="rounded-md border p-2 hover:bg-gray-50"><ChevronRightIcon className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm flex flex-wrap items-center justify-between">
        <div><h3 className="text-lg font-medium">批量操作</h3></div>
        <div className="flex space-x-3">
          <button onClick={() => handleBulkStatus('present')} className="inline-flex items-center rounded-md bg-green-100 px-4 py-2 text-sm text-green-800 hover:bg-green-200"><CheckCircleIcon className="mr-2 h-5 w-5" />全部出勤</button>
          <button onClick={() => handleBulkStatus('leave')} className="inline-flex items-center rounded-md bg-yellow-100 px-4 py-2 text-sm text-yellow-800 hover:bg-yellow-200"><ClockIcon className="mr-2 h-5 w-5" />全部请假</button>
          <button onClick={() => handleBulkStatus('absent')} className="inline-flex items-center rounded-md bg-red-100 px-4 py-2 text-sm text-red-800 hover:bg-red-200"><XCircleIcon className="mr-2 h-5 w-5" />全部缺勤</button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {successMessage && <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">{successMessage}</div>}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div></div>
      ) : selectedClassId && students.length > 0 ? (
        <div className="rounded-lg bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">学生姓名</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">年级</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">考勤状态</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => {
                const record = attendanceRecords.find(r => r.studentId === student.id);
                const status = record?.status || 'present';
                const remark = record?.remark || '';
                return (
                  <tr key={student.id}>
                    <td className="px-6 py-4 font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.grade}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleStatusChange(student.id, 'present')} className={`rounded-md px-3 py-1 text-sm ${status === 'present' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}>出勤</button>
                        <button onClick={() => handleStatusChange(student.id, 'leave')} className={`rounded-md px-3 py-1 text-sm ${status === 'leave' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}>请假</button>
                        <button onClick={() => handleStatusChange(student.id, 'absent')} className={`rounded-md px-3 py-1 text-sm ${status === 'absent' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>缺勤</button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(status === 'leave' || status === 'absent') && (
                        <input type="text" value={remark} onChange={(e) => handleRemarkChange(student.id, e.target.value)} placeholder="请输入备注" className="w-full rounded-md border px-3 py-1 text-sm" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t bg-gray-50 px-6 py-4">
            <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-70">
              <CheckIcon className="mr-2 h-5 w-5" />{isSaving ? '保存中...' : '保存考勤记录'}
            </button>
            <p className="mt-2 text-sm text-gray-500">共 {students.length} 名学生，{attendanceRecords.filter(r => r.status === 'present').length} 人出勤</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold">{selectedClassId ? '班级暂无学生' : '请选择班级'}</h3>
        </div>
      )}
    </div>
  );
}
