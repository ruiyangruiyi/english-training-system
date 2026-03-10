import { NextResponse } from 'next/server';

let wechatGroups: Array<{
  id: string;
  name: string;
  memberCount: number;
}> = [];

export async function POST(request: Request) {
  try {
    const groups = await request.json();
    wechatGroups = groups;
    return NextResponse.json({ success: true, count: groups.length });
  } catch (error) {
    console.error('更新群列表失败:', error)
    return NextResponse.json({ error: '更新群列表失败' }, { status: 400 });
  }
}

export async function GET() {
  if (wechatGroups.length === 0) {
    return NextResponse.json([
      { id: 'wxid_group_001', name: '初级英语班家长群', memberCount: 25 },
      { id: 'wxid_group_002', name: '中级英语班家长群', memberCount: 18 },
      { id: 'wxid_group_003', name: '高级英语班家长群', memberCount: 12 },
    ]);
  }
  
  return NextResponse.json(wechatGroups);
}
