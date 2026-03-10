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
      if (!res.ok) throw new Error('获取班级列表失败');
      const data = await res.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) setSelectedClassId(data[0].id.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级列表失败');
    }
  };

  const fetchClassStudents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      if (!res.ok) throw new Error('获取学生列表失败');
      const data = await res.json();
      setStudents(data);
      const initial = data.map((s: Student) => ({ studentId: s.id, status: 'present' as const, remark: '' }));
      setAttendanceRecords(initial);
      setSavedRecords(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取学生列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    if (!selectedClassId || !selectedDate) return;
    try {
      const res = await fetch(`/api/attendances?classId=${selectedClassId}&date=${selectedDate}`);
      if (!res.ok) throw new Error('获取考勤记录失败');
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
      // 没有记录，保持默认
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
    if (!selectedClassId || !selectedDate) { setError('请选择班级和日期'); return; }
    if (attendanceRecords.length === 0) { setError('没有学生记录'); return; }
    if (!hasChanges()) { setError(''); setSuccessMessage('没有修改，无需保存'); return; }

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
        throw new Error(errData.error || '保存失败');
      }
      setSavedRecords(JSON.parse(JSON.stringify(attendanceRecords)));
      setSuccessMessage('✅ 考勤记录保存成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusText = (s: string) => s === 'present' ? '出勤' : s === 'leave' ? '请假' : '缺勤';
  const getStatusClass = (s: string) => s === 'present' ? 'bg-green-100 text-green-800 border-green-300' : s === 'leave' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300';
