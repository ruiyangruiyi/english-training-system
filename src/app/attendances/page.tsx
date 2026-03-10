"use client";

import { useState, useEffect, useRef } from 'react';
import {
  CalendarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type ClassType = {
  id: number;
  name: string;
};

type Student = {
  id: number;
  name: string;
  grade: string;
};

type AttendanceRecord = {
  studentId: number;
  status: 'present' | 'leave' | 'absent';
  remark?: string;
};

interface User {
  id: number;
  role: string;
}

export default function AttendancesPage() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [savedRecords, setSavedRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (user) fetchClasses();
  }, [user]);

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
      if (!res.ok) throw new Error('èŽ·å–ç­çº§åˆ—è¡¨å¤±è´¥');
      const data = await res.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) setSelectedClassId(data[0].id.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'èŽ·å–ç­çº§åˆ—è¡¨å¤±è´¥');
    }
  };

  const fetchClassStudents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      if (!res.ok) throw new Error('èŽ·å–å­¦ç”Ÿåˆ—è¡¨å¤±è´¥');
      const data = await res.json();
      setStudents(data);
      const initial = data.map((s: Student) => ({ studentId: s.id, status: 'present' as const, remark: '' }));
      setAttendanceRecords(initial);
      setSavedRecords(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'èŽ·å–å­¦ç”Ÿåˆ—è¡¨å¤±è´¥');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    if (!selectedClassId || !selectedDate) return;
    try {
      const res = await fetch(`/api/attendances?classId=${selectedClassId}&date=${selectedDate}`);
      if (!res.ok) throw new Error('èŽ·å–è€ƒå‹¤è®°å½•å¤±è´¥');
      const data = await res.json();
      if (data.length > 0) {
        const records = students.map(s => {
          const existing = data.find((a: any) => a.studentId === s.id);
          return {
            studentId: s.id,
            status: existing ? existing.status : 'present',
            remark: existing?.remark || '',
          };
        });
        setAttendanceRecords(records);
        setSavedRecords(JSON.parse(JSON.stringify(records)));
      } else {
        const initial = students.map(s => ({ studentId: s.id, status: 'present' as const, remark: '' }));
        setAttendanceRecords(initial);
        setSavedRecords(JSON.parse(JSON.stringify(initial)));
      }
    } catch (_err) {
      // æ²¡æœ‰è®°å½•ï¼Œä¿æŒé»˜è®¤
    }
  };

  const hasChanges = () => {
    return JSON.stringify(attendanceRecords) !== JSON.stringify(savedRecords);
  };

  const handleStatusChange = (studentId: number, status: 'present' | 'leave' | 'absent') => {
    setAttendanceRecords(records =>
      records.map(r => r.studentId === studentId 
        ? { ...r, status, remark: status === 'present' ? '' : r.remark } 
        : r)
    );
    setSuccessMessage('');
  };

  const handleRemarkChange = (studentId: number, remark: string) => {
    setAttendanceRecords(records =>
      records.map(r => r.studentId === studentId ? { ...r, remark } : r)
    );
    setSuccessMessage('');
  };

  const handleBulkStatus = (status: 'present' | 'leave' | 'absent') => {
    setAttendanceRecords(records =>
      records.map(r => ({ ...r, status, remark: status === 'present' ? '' : r.remark }))
    );
    setSuccessMessage('');
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSuccessMessage('');
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedDate) { setError('è¯·é€‰æ‹©ç­çº§å’Œæ—¥æœŸ'); return; }
    if (attendanceRecords.length === 0) { setError('æ²¡æœ‰å­¦ç”Ÿè®°å½•'); return; }
    if (!hasChanges()) { setError(''); setSuccessMessage('æ²¡æœ‰ä¿®æ”¹ï¼Œæ— éœ€ä¿å­˜'); return; }

    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: parseInt(selectedClassId),
          date: selectedDate,
          records: attendanceRecords,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'ä¿å­˜å¤±è´¥');
      }
      setSavedRecords(JSON.parse(JSON.stringify(attendanceRecords)));
      setSuccessMessage('âœ… è€ƒå‹¤è®°å½•ä¿å­˜æˆåŠŸï¼');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ä¿å­˜å¤±è´¥');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusText = (s: string) => s === 'present' ? 'å‡ºå‹¤' : s === 'leave' ? 'è¯·å‡' : 'ç¼ºå‹¤';
  const getStatusClass = (s: string) => s === 'present' ? 'bg-green-100 text-green-800 border-green-300' : s === 'leave' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¿¼ÇÚ¹ÜÀí</h1>
          <p className="mt-1 text-sm text-gray-600">¼ÇÂ¼ºÍ²é¿´Ñ§ÉúµÄ³öÇÚÇé¿ö</p>
        </div>
      </div>

      {/* É¸Ñ¡Çø */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ñ¡Ôñ°à¼¶</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
              <option value="">ÇëÑ¡Ôñ°à¼¶</option>
              {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ñ¡ÔñÈÕÆÚ</label>
            <div className="mt-1 flex items-center space-x-2">
              <button onClick={() => changeDate(-1)} className="rounded-md border border-gray-300 p-2 hover:bg-gray-50"><ChevronLeftIcon className="h-5 w-5" /></button>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" />
              <button onClick={() => changeDate(1)} className="rounded-md border border-gray-300 p-2 hover:bg-gray-50"><ChevronRightIcon className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ÅúÁ¿²Ù×÷ */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">ÅúÁ¿²Ù×÷</h3>
            <p className="mt-1 text-sm text-gray-600">¿ìËÙÉèÖÃËùÓÐÑ§ÉúµÄ¿¼ÇÚ×´Ì¬</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button onClick={() => handleBulkStatus('present')} className="inline-flex items-center rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200"><CheckCircleIcon className="mr-2 h-5 w-5" />È«²¿³öÇÚ</button>
            <button onClick={() => handleBulkStatus('leave')} className="inline-flex items-center rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-200"><ClockIcon className="mr-2 h-5 w-5" />È«²¿Çë¼Ù</button>
            <button onClick={() => handleBulkStatus('absent')} className="inline-flex items-center rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"><XCircleIcon className="mr-2 h-5 w-5" />È«²¿È±ÇÚ</button>
          </div>
        </div>
      </div>

      {error && (<div className="rounded-md bg-red-50 p-4"><div className="flex"><div className="ml-3"><h3 className="text-sm font-medium text-red-800">{error}</h3></div></div></div>)}
      {successMessage && (<div className="rounded-md bg-green-50 p-4"><div className="flex"><div className="ml-3"><h3 className="text-sm font-medium text-green-800">{successMessage}</h3></div></div></div>)}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div></div>
      ) : selectedClassId && students.length > 0 ? (
        <div className="rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ñ§ÉúÐÕÃû</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Äê¼¶</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">¿¼ÇÚ×´Ì¬</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">±¸×¢</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.map((student) => {
                  const record = attendanceRecords.find(r => r.studentId === student.id);
                  const status = record?.status || 'present';
                  const remark = record?.remark || '';
                  return (
                    <tr key={student.id}>
                      <td className="whitespace-nowrap px-6 py-4"><div className="font-medium text-gray-900">{student.name}</div></td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{student.grade}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleStatusChange(student.id, 'present')} className={ounded-md px-3 py-1 text-sm +(status === 'present' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200')}>³öÇÚ</button>
                          <button onClick={() => handleStatusChange(student.id, 'leave')} className={ounded-md px-3 py-1 text-sm +(status === 'leave' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200')}>Çë¼Ù</button>
                          <button onClick={() => handleStatusChange(student.id, 'absent')} className={ounded-md px-3 py-1 text-sm +(status === 'absent' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200')}>È±ÇÚ</button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(status === 'leave' || status === 'absent') && (
                          <input type="text" value={remark} onChange={(e) => handleRemarkChange(student.id, e.target.value)} placeholder="ÇëÊäÈë±¸×¢Ô­Òò" className="block w-full rounded-md border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button onClick={handleSave} disabled={isSaving || !selectedClassId || students.length === 0} className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed">
              <CheckIcon className="mr-2 h-5 w-5" />{isSaving ? '±£´æÖÐ...' : '±£´æ¿¼ÇÚ¼ÇÂ¼'}
            </button>
            <p className="mt-2 text-sm text-gray-500">¹² {students.length} ÃûÑ§Éú£¬{attendanceRecords.filter(r => r.status === 'present').length} ÈË³öÇÚ</p>
          </div>
        </div>
      ) : selectedClassId ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center"><AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-semibold text-gray-900">°à¼¶ÔÝÎÞÑ§Éú</h3></div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center"><AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-semibold text-gray-900">ÇëÑ¡Ôñ°à¼¶</h3></div>
      )}
    </div>
  );
}
