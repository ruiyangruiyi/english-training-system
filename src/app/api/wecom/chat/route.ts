import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 建群流程步骤（极简版：只问班级名称）
const STEPS = {
  INPUT_NAME: 'input_name',
  DONE: 'done'
};

// 会话过期时间（5分钟）
const SESSION_EXPIRE_MS = 5 * 60 * 1000;

// POST /api/wecom/chat - 处理企业微信消息
export async function POST(request: NextRequest) {
  try {
    const { userId, content } = await request.json();

    if (!userId || !content) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const message = content.trim();
    
    // 获取会话
    let session = await prisma.chatSession.findUnique({
      where: { userId }
    });

    // 检查会话是否过期
    if (session && new Date() > new Date(session.expiresAt)) {
      await prisma.chatSession.delete({ where: { userId } });
      session = null;
    }

    // 处理"建群"命令
    if (message === 'create' || message === '建群') {
      const expiresAt = new Date(Date.now() + SESSION_EXPIRE_MS);
      
      if (session) {
        await prisma.chatSession.update({
          where: { userId },
          data: {
            sessionType: 'create_group',
            currentStep: STEPS.INPUT_NAME,
            data: '{}',
            expiresAt
          }
        });
      } else {
        await prisma.chatSession.create({
          data: {
            userId,
            sessionType: 'create_group',
            currentStep: STEPS.INPUT_NAME,
            data: '{}',
            expiresAt
          }
        });
      }

      return NextResponse.json({
        reply: '请输入班级名称：',
        step: STEPS.INPUT_NAME
      });
    }

    // 处理"取消"命令
    if ((message === 'cancel' || message === '取消') && session) {
      await prisma.chatSession.delete({ where: { userId } });
      return NextResponse.json({
        reply: '已取消。',
        step: null
      });
    }

    // 没有活跃会话
    if (!session) {
      return NextResponse.json({
        reply: '发送「建群」创建班级群',
        step: null
      });
    }

    // 处理建群流程 - 只有一步：输入班级名称
    if (session.sessionType === 'create_group' && session.currentStep === STEPS.INPUT_NAME) {
      const className = message;
      
      // 直接创建班级和群
      const result = await createClassAndGroup(className, userId);
      
      // 清除会话
      await prisma.chatSession.delete({ where: { userId } });
      
      return NextResponse.json({
        reply: `✅ 创建成功！\n\n📚 班级：${className}\n\n[群二维码]\n${result.qrcodeUrl}\n\n请将二维码分享给家长扫码入群\n其他信息可在管理系统中补充`,
        step: STEPS.DONE,
        class: result.class,
        qrcode: result.qrcodeUrl
      });
    }

    return NextResponse.json({
      reply: '发送「建群」创建班级群',
      step: null
    });

  } catch (error) {
    console.error('处理消息失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}

// 创建班级和企业微信群
async function createClassAndGroup(className: string, oderId: string) {
  // TODO: 调用企业微信API创建客户群
  // 实际需要对接企业微信API
  const mockGroupId = `ww_group_${Date.now()}`;
  const mockQrcodeUrl = `https://work.weixin.qq.com/qrcode/${mockGroupId}`;

  // 创建班级（年级和上课时间后续在管理系统补充）
  const newClass = await prisma.class.create({
    data: {
      name: className,
      grade: '',  // 待补充
      schedule: '',  // 待补充
      wechatGroupId: mockGroupId,
      wechatGroupName: className  // 群名=班级名
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

    if (!session || new Date() > new Date(session.expiresAt)) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        type: session.sessionType,
        step: session.currentStep
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
