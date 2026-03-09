import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/wecom/group-update - 处理微信群名变更事件
// 当微信群名在企业微信中被修改时，同步更新管理系统中的班级名称
export async function POST(request: NextRequest) {
  try {
    const { chatId, newName, updateDetail } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: '缺少群ID' }, { status: 400 });
    }

    // 查找关联的班级
    const classItem = await prisma.class.findFirst({
      where: { wechatGroupId: chatId }
    });

    if (!classItem) {
      return NextResponse.json({ 
        success: false, 
        message: '未找到关联班级' 
      });
    }

    // 如果群名有变更，同步更新班级名称
    if (newName && newName !== classItem.name) {
      await prisma.class.update({
        where: { id: classItem.id },
        data: {
          name: newName,
          wechatGroupName: newName
        }
      });

      console.log(`微信群名变更同步: ${classItem.name} -> ${newName}`);

      return NextResponse.json({
        success: true,
        message: '班级名称已同步更新',
        oldName: classItem.name,
        newName: newName
      });
    }

    return NextResponse.json({
      success: true,
      message: '无需更新'
    });

  } catch (error) {
    console.error('处理群名变更失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
