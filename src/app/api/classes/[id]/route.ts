import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const classItem = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: { students: true }
    })

    if (!classItem) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 })
    }

    return NextResponse.json(classItem)
  } catch (_error) {
    return NextResponse.json({ error: '获取班级详情失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { name, grade, schedule } = await request.json()

    // 获取当前班级信息
    const currentClass = await prisma.class.findUnique({
      where: { id: parseInt(id) }
    })

    if (!currentClass) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 })
    }

    // 更新班级
    const updated = await prisma.class.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        grade, 
        schedule,
        // 如果班级名称变更，同步更新微信群名
        wechatGroupName: name !== currentClass.name ? name : currentClass.wechatGroupName
      }
    })

    // TODO: 如果有绑定微信群且名称变更，调用企业微信API更新群名
    if (currentClass.wechatGroupId && name !== currentClass.name) {
      await syncGroupName(currentClass.wechatGroupId, name)
    }

    return NextResponse.json(updated)
  } catch (_error) {
    return NextResponse.json({ error: '更新班级失败' }, { status: 500 })
  }
}

// 同步微信群名（调用企业微信API）
async function syncGroupName(groupId: string, newName: string) {
  // TODO: 实际调用企业微信API
  // POST https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/update
  console.log(`同步微信群名: ${groupId} -> ${newName}`)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.class.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: '删除班级失败' }, { status: 500 })
  }
}
