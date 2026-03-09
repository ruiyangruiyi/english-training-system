import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 建群流程步骤
const CREATE_GROUP_STEPS = {
  START: 'start',
  INPUT_NAME: 'input_name',
  INPUT_GRADE: 'input_grade', 
  INPUT_SCHEDULE: 'input_schedule',
  CONFIRM: 'confirm',
  DONE: 'done'
};

// 会话过期时间（10分钟）
const SESSION_EXPIRE_MS = 10 * 60 * 1000;

// POST /api/wecom/chat - 处理企业微信消息
export async function POST(request: NextRequest) {
  try {
    const { userId, content } = await request.json();

    if (!userId || !content) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const message = content.trim();
    
    // 获取或创建会话
    let session = await prisma.chatSession.findUnique({
      where: { userId }
    });

    // 检查会话是否过期
    if (session && new Date() > new Date(session.expiresAt)) {
      await prisma.chatSession.delete({ where: { userId } });
      session = null;
    }

    // 处理"建群"命令 - 开始新会话
    if (message === '建群') {
      const expiresAt = new Date(Date.now() + SESSION_EXPIRE_MS);
      
      if (session) {
        await prisma.chatSession.update({
          where: { userId },
          data: {
            sessionType: 'create_group',
            currentStep: CREATE_GROUP_STEPS.INPUT_NAME,
            data: '{}',
            expiresAt
          }
        });
      } else {
        await prisma.chatSession.create({
          data: {
            userId,
            sessionType: 'create_group',
            currentStep: CREATE_GROUP_STEPS.INPUT_NAME,
            data: '{}',
            expiresAt
          }
        });
      }

      return NextResponse.json({
        reply: '请输入群名称：',
        step: CREATE_GROUP_STEPS.INPUT_NAME
      });
    }

    // 处理"取消"命令
    if (message === '取消' && session) {
      await prisma.chatSession.delete({ where: { userId } });
      return NextResponse.json({
        reply: '已取消操作。',
        step: null
      });
    }

    // 没有活跃会话
    if (!session) {
      return NextResponse.json({
        reply: '您好！发送「建群」开始创建班级群。',
        step: null
      });
    }

    // 处理建群流程
    if (session.sessionType === 'create_group') {
      return await handleCreateGroupFlow(session, message, userId);
    }

    return NextResponse.json({
      reply: '未知命令，发送「建群」开始创建班级群。',
      step: null
    });

  } catch (error) {
    console.error('处理消息失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}

// 处理建群流程
async function handleCreateGroupFlow(
  session: { currentStep: string; data: string; userId: string },
  message: string,
  userId: string
) {
  const data = JSON.parse(session.data);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRE_MS);

  switch (session.currentStep) {
    case CREATE_GROUP_STEPS.INPUT_NAME:
      // 保存群名称，进入下一步
      data.groupName = message;
      await prisma.chatSession.update({
        where: { userId },
        data: {
          currentStep: CREATE_GROUP_STEPS.INPUT_GRADE,
          data: JSON.stringify(data),
          expiresAt
        }
      });
      return NextResponse.json({
        reply: '请输入班级年级（如：小一、中二、高三）：',
        step: CREATE_GROUP_STEPS.INPUT_GRADE
      });

    case CREATE_GROUP_STEPS.INPUT_GRADE:
      // 保存年级，进入下一步
      data.grade = message;
      await prisma.chatSession.update({
        where: { userId },
        data: {
          currentStep: CREATE_GROUP_STEPS.INPUT_SCHEDULE,
          data: JSON.stringify(data),
          expiresAt
        }
      });
      return NextResponse.json({
        reply: '请输入上课时间（如：周六上午9:00）：',
        step: CREATE_GROUP_STEPS.INPUT_SCHEDULE
      });

    case CREATE_GROUP_STEPS.INPUT_SCHEDULE:
      // 保存上课时间，进入确认步骤
      data.schedule = message;
      await prisma.chatSession.update({
        where: { userId },
        data: {
          currentStep: CREATE_GROUP_STEPS.CONFIRM,
          data: JSON.stringify(data),
          expiresAt
        }
      });
      return NextResponse.json({
        reply: `确认创建？\n\n📝 群名：${data.groupName}\n📚 年级：${data.grade}\n⏰ 上课时间：${data.schedule}\n\n回复「确认」创建，「取消」重新输入`,
        step: CREATE_GROUP_STEPS.CONFIRM,
        preview: data
      });

    case CREATE_GROUP_STEPS.CONFIRM:
      if (message === '确认') {
        // 创建班级和群
        const result = await createClassAndGroup(data, userId);
        
        // 清除会话
        await prisma.chatSession.delete({ where: { userId } });
        
        return NextResponse.json({
          reply: `✅ 创建成功！\n\n📝 群名：${data.groupName}\n📚 年级：${data.grade}\n⏰ 上课时间：${data.schedule}\n\n班级已自动添加到管理系统\n群ID：${result.wechatGroupId}\n\n请将群二维码分享给家长扫码入群`,
          step: CREATE_GROUP_STEPS.DONE,
          class: result.class,
          qrcode: result.qrcodeUrl
        });
      } else {
        // 重新开始
        await prisma.chatSession.update({
          where: { userId },
          data: {
            currentStep: CREATE_GROUP_STEPS.INPUT_NAME,
            data: '{}',
            expiresAt
          }
        });
        return NextResponse.json({
          reply: '好的，重新开始。\n\n请输入群名称：',
          step: CREATE_GROUP_STEPS.INPUT_NAME
        });
      }

    default:
      return NextResponse.json({
        reply: '会话状态异常，请重新发送「建群」开始。',
        step: null
      });
  }
}

// 创建班级和企业微信群
async function createClassAndGroup(
  data: { groupName: string; grade: string; schedule: string },
  oderId: string
) {
  // TODO: 调用企业微信API创建客户群
  // 这里先模拟，实际需要对接企业微信API
  const mockGroupId = `ww_group_${Date.now()}`;
  const mockQrcodeUrl = `https://work.weixin.qq.com/qrcode/${mockGroupId}`;

  // 查找老师（通过企业微信用户ID关联）
  // TODO: 需要建立企业微信用户ID和系统用户的映射
  // 暂时创建不关联老师的班级
  
  // 创建班级
  const newClass = await prisma.class.create({
    data: {
      name: data.groupName,
      grade: data.grade,
      schedule: data.schedule,
      wechatGroupId: mockGroupId,
      wechatGroupName: data.groupName
    }
  });

  return {
    class: newClass,
    wechatGroupId: mockGroupId,
    qrcodeUrl: mockQrcodeUrl
  };
}

// GET /api/wecom/chat - 获取会话状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少userId' }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { userId }
    });

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // 检查是否过期
    if (new Date() > new Date(session.expiresAt)) {
      await prisma.chatSession.delete({ where: { userId } });
      return NextResponse.json({ session: null, expired: true });
    }

    return NextResponse.json({
      session: {
        type: session.sessionType,
        step: session.currentStep,
        data: JSON.parse(session.data),
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    console.error('获取会话状态失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
