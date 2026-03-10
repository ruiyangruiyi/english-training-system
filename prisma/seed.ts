import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { role: 'admin', status: 'active' },
    create: {
      username: 'admin',
      password: 'admin123',
      name: '管理员',
      role: 'admin',
      status: 'active',
      phone: '13800000000',
      wechat: 'admin_wechat',
      subject: '管理'
    }
  })
  console.log('Created admin:', admin)

  const teacher1 = await prisma.user.upsert({
    where: { username: 'teacher1' },
    update: { status: 'active' },
    create: {
      username: 'teacher1',
      password: 'teacher123',
      name: '王老师',
      role: 'teacher',
      status: 'active',
      phone: '13800000001',
      wechat: 'wang_laoshi',
      subject: '英语'
    }
  })

  const teacher2 = await prisma.user.upsert({
    where: { username: 'teacher2' },
    update: { status: 'active' },
    create: {
      username: 'teacher2',
      password: 'teacher123',
      name: '李老师',
      role: 'teacher',
      status: 'active',
      phone: '13800000002',
      wechat: 'li_laoshi',
      subject: '数学'
    }
  })
  console.log('Created teachers:', teacher1, teacher2)

  const class1 = await prisma.class.create({
    data: {
      name: '初级英语班',
      grade: '一年级',
      schedule: '周六 9:00-11:00',
      teacherId: teacher1.id
    }
  })

  const class2 = await prisma.class.create({
    data: {
      name: '中级英语班',
      grade: '三年级',
      schedule: '周六 14:00-16:00',
      teacherId: teacher2.id
    }
  })
  console.log('Created classes:', class1, class2)

  const student1 = await prisma.student.create({
    data: { name: '张三', grade: '一年级', parentPhone: '13800138001', classId: class1.id }
  })
  const student2 = await prisma.student.create({
    data: { name: '李四', grade: '一年级', parentPhone: '13800138002', classId: class1.id }
  })
  const student3 = await prisma.student.create({
    data: { name: '王五', grade: '三年级', parentPhone: '13800138003', classId: class2.id }
  })
  console.log('Created students:', student1, student2, student3)

  await prisma.payment.createMany({
    data: [
      { studentId: student1.id, term: '2026春季', status: 'paid', amount: 3000, paymentMethod: 'wechat', paidAt: new Date() },
      { studentId: student2.id, term: '2026春季', status: 'unpaid', amount: 3000 },
      { studentId: student3.id, term: '2026春季', status: 'joined', amount: 3000 }
    ]
  })
  console.log('Seed completed!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
