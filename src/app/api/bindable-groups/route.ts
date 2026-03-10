import { NextResponse } from 'next/server';

// 模拟微信群列表（实际由WeChatFerry机器人提供）
// 机器人启动后会更新这个列表
let wechatGroups: Array<{
  id: string;
  name: string;
  memberCount: number;
}> = [];

// 供机器人调用更新群列表
export async function POST(request: Request) {
  try {
    const groups = await request.json();
    wechatGroups = groups;
    return NextResponse.json({ success: true, count: groups.length });
  } catch (error) {
    return NextResponse.json({ error: '更新群列表失败' }, { status: 400 });
  }
}

// 获取可绑定的微信群列表
export async function GET() {
  // 如果机器人未启动，返回模拟数据供测试
  if (wechatGroups.length === 0) {
    return NextResponse.json([
      { id: 'wxid_group_001', name: '初级英语班家长群', memberCount: 25 },
      { id: 'wxid_group_002', name: '中级英语班家长群', memberCount: 18 },
      { id: 'wxid_group_003', name: '高级英语班家长群', memberCount: 12 },
    ]);
  }
  
  return NextResponse.json(wechatGroups);
}
