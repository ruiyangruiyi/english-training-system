// 测试脚本 - 验证所有 API 接口
// 运行方式：npm run dev 后，在另一个终端执行 node test-api.js

const BASE_URL = 'http://localhost:3000';

async function testAPI(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    console.log(`✅ ${method} ${path}`, response.status, data);
    return data;
  } catch (error) {
    console.error(`❌ ${method} ${path}`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 开始测试 API...\n');

  // 1. 测试登录
  console.log('--- 测试登录 ---');
  await testAPI('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });

  // 2. 测试班级
  console.log('\n--- 测试班级 ---');
  const classes = await testAPI('GET', '/api/classes');
  if (classes && classes.length > 0) {
    await testAPI('GET', `/api/classes/${classes[0].id}`);
  }

  // 3. 测试学生
  console.log('\n--- 测试学生 ---');
  const students = await testAPI('GET', '/api/students');
  if (students && students.length > 0) {
    await testAPI('GET', `/api/students/${students[0].id}`);
  }

  // 4. 测试考勤
  console.log('\n--- 测试考勤 ---');
  await testAPI('GET', '/api/attendances');

  // 5. 测试缴费
  console.log('\n--- 测试缴费 ---');
  const payments = await testAPI('GET', '/api/payments');
  if (payments && payments.length > 0) {
    await testAPI('GET', `/api/payments/${payments[0].id}`);
  }

  // 6. 测试作业
  console.log('\n--- 测试作业 ---');
  await testAPI('GET', '/api/homeworks');

  console.log('\n✨ 测试完成！');
}

runTests();
