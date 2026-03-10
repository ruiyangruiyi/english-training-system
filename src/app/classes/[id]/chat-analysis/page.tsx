"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon, CalendarIcon, ChatBubbleLeftRightIcon,
  ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

type ChatSummary = {
  id: number;
  date: string;
  summary: string;
  messageCount: number;
  activeMembers: number;
  topics: string[];
  messages?: { time: string; sender: string; content: string }[];
};

export default function ChatAnalysisPage() {
  const params = useParams();
  const classId = params.id as string;
  
  const [className, setClassName] = useState('');
  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [showMessages, setShowMessages] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchClassName();
    fetchSummaries();
  }, [classId, currentMonth]);

  const fetchClassName = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setClassName(data.name);
      }
    } catch (err) { console.error(err); }
  };

  const fetchSummaries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/chat-summaries?month=${currentMonth}`);
      if (res.ok) {
        setSummaries(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      day: date.getDate(),
      weekday: weekdays[date.getDay()],
      full: `${date.getMonth() + 1}月${date.getDate()}日`,
    };
  };

  const filteredSummaries = selectedDate
    ? summaries.filter(s => s.date === selectedDate)
    : summaries;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/classes/${classId}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="mr-2 h-5 w-5" />返回班级详情
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">群聊分析报告</h1>
        <p className="mt-1 text-sm text-gray-600">{className} - AI智能摘要</p>
      </div>

      {/* 月份选择器 */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-lg font-medium text-gray-900">
            {currentMonth.replace('-', '年')}月
          </span>
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* 日期筛选 */}
      {summaries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedDate('')}
            className={`px-3 py-1 text-sm rounded-full ${!selectedDate ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            全部
          </button>
          {[...new Set(summaries.map(s => s.date))].map(date => (
            <button key={date} onClick={() => setSelectedDate(date)}
              className={`px-3 py-1 text-sm rounded-full ${selectedDate === date ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {formatDate(date).full}
            </button>
          ))}
        </div>
      )}

      {/* 摘要卡片列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无群聊记录</h3>
          <p className="mt-1 text-sm text-gray-500">该月份没有群聊分析数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((summary) => {
            const dateInfo = formatDate(summary.date);
            return (
              <div key={summary.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* 卡片头部 */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      <div className="text-3xl font-bold mr-3">{dateInfo.day}</div>
                      <div>
                        <div className="text-sm opacity-90">{dateInfo.weekday}</div>
                        <div className="text-xs opacity-75">{summary.date}</div>
                      </div>
                    </div>
                    <div className="text-right text-white">
                      <div className="text-sm">{summary.messageCount} 条消息</div>
                      <div className="text-xs opacity-75">{summary.activeMembers} 人参与</div>
                    </div>
                  </div>
                </div>

                {/* 卡片内容 */}
                <div className="p-6">
                  {/* AI摘要 */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">📝 AI摘要</h4>
                    <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
                  </div>

                  {/* 话题标签 */}
                  {summary.topics && summary.topics.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">🏷️ 主要话题</h4>
                      <div className="flex flex-wrap gap-2">
                        {summary.topics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 查看原始消息 */}
                  <button onClick={() => setShowMessages(showMessages === summary.id ? null : summary.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {showMessages === summary.id ? '收起原始消息' : '查看原始消息'}
                  </button>

                  {/* 原始消息列表 */}
                  {showMessages === summary.id && summary.messages && (
                    <div className="mt-4 border-t pt-4 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {summary.messages.map((msg, i) => (
                          <div key={i} className="flex text-sm">
                            <span className="text-gray-400 w-16 flex-shrink-0">{msg.time}</span>
                            <span className="text-indigo-600 font-medium mr-2">{msg.sender}:</span>
                            <span className="text-gray-700">{msg.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
