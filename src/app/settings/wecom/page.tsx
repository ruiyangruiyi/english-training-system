"use client";

import { useState, useEffect } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

type WecomConfig = {
  corpId: string;
  agentId: string;
  secret: string;
  token: string;
  encodingAESKey: string;
};

export default function WecomSettingsPage() {
  const [config, setConfig] = useState<WecomConfig>({
    corpId: '', agentId: '', secret: '', token: '', encodingAESKey: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);

  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/wecom/callback` 
    : '';

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/wecom');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('获取配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/settings/wecom', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('保存失败');
      setMessage({ type: 'success', text: '配置保存成功！' });
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">企业微信配置</h1>
        <p className="mt-1 text-sm text-gray-600">配置企业微信应用，实现消息推送和群管理功能</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        {/* 回调URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">回调URL</label>
          <div className="flex">
            <input type="text" value={callbackUrl} readOnly
              className="flex-1 rounded-l-md border-gray-300 bg-gray-50 text-sm border px-3 py-2" />
            <button onClick={copyCallbackUrl}
              className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200">
              {copied ? <CheckIcon className="h-5 w-5 text-green-600" /> : <ClipboardIcon className="h-5 w-5 text-gray-500" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">在企业微信后台"接收消息"中配置此URL</p>
        </div>

        {/* 企业ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">企业ID (CorpID)</label>
          <input type="text" value={config.corpId}
            onChange={(e) => setConfig({ ...config, corpId: e.target.value })}
            placeholder="如：ww1234567890abcdef"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
        </div>

        {/* 应用ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">应用ID (AgentID)</label>
          <input type="text" value={config.agentId}
            onChange={(e) => setConfig({ ...config, agentId: e.target.value })}
            placeholder="如：1000002"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
        </div>

        {/* Secret */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">应用Secret</label>
          <input type="password" value={config.secret}
            onChange={(e) => setConfig({ ...config, secret: e.target.value })}
            placeholder="应用的Secret密钥"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
        </div>

        {/* Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
          <input type="text" value={config.token}
            onChange={(e) => setConfig({ ...config, token: e.target.value })}
            placeholder="接收消息的Token"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
        </div>

        {/* EncodingAESKey */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">EncodingAESKey</label>
          <input type="text" value={config.encodingAESKey}
            onChange={(e) => setConfig({ ...config, encodingAESKey: e.target.value })}
            placeholder="消息加密密钥（43位）"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2" />
        </div>

        <div className="pt-4 border-t">
          <button onClick={handleSave} disabled={saving}
            className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      {/* 配置说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">配置步骤</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>登录企业微信管理后台</li>
          <li>进入"应用管理" → 创建自建应用</li>
          <li>复制企业ID、应用ID和Secret填入上方</li>
          <li>在"接收消息"中配置回调URL、Token和EncodingAESKey</li>
          <li>保存配置后即可使用企业微信功能</li>
        </ol>
      </div>
    </div>
  );
}
