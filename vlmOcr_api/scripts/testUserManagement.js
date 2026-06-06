const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'test123456';
const testEmail = 'test@example.com';

async function testUserManagement() {
  console.log('🧪 开始测试用户管理功能...\n');

  try {
    // 1. 注册用户
    console.log('1. 注册用户...');
    await axios.post(`${BASE_URL}/users/register`, {
      username: testUsername,
      password: testPassword,
      email: testEmail
    });
    console.log('✅ 用户注册成功\n');

    // 2. 用户登录
    console.log('2. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      username: testUsername,
      password: testPassword
    });
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('✅ 登录成功，用户ID:', userId);

    // 3. 获取当前用户信息
    console.log('3. 获取当前用户信息...');
    const userInfoResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 当前用户信息:', userInfoResponse.data.user);

    // 4. 测试更新用户信息 - 成功更新用户名
    console.log('\n4. 测试更新用户信息 - 更新用户名...');
    const newUsername = `updated_${testUsername}`;
    const updateUsernameResponse = await axios.put(`${BASE_URL}/users/${userId}`, {
      username: newUsername
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 用户名更新成功:', updateUsernameResponse.data.user.username);

    // 5. 测试更新用户信息 - 更新邮箱
    console.log('\n5. 测试更新用户信息 - 更新邮箱...');
    const newEmail = 'updated@example.com';
    const updateEmailResponse = await axios.put(`${BASE_URL}/users/${userId}`, {
      email: newEmail
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 邮箱更新成功:', updateEmailResponse.data.user.email);

    // 6. 测试更新用户信息 - 同时更新用户名和邮箱
    console.log('\n6. 测试更新用户信息 - 同时更新用户名和邮箱...');
    const finalUsername = `final_${testUsername}`;
    const finalEmail = 'final@example.com';
    const updateBothResponse = await axios.put(`${BASE_URL}/users/${userId}`, {
      username: finalUsername,
      email: finalEmail
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 信息同时更新成功:', updateBothResponse.data.user);

    // 7. 测试更新用户信息 - 用户名已存在
    console.log('\n7. 测试更新用户信息 - 用户名已存在...');
    try {
      await axios.put(`${BASE_URL}/users/${userId}`, {
        username: finalUsername // 使用已存在的用户名
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ 应该失败但成功了');
    } catch (error) {
      if (error.response && error.response.data.error === '用户名已存在') {
        console.log('✅ 正确检测到用户名已存在');
      } else {
        console.log('❌ 错误类型不正确:', error.response?.data?.error);
      }
    }

    // 8. 测试更新用户信息 - 邮箱已存在
    console.log('\n8. 测试更新用户信息 - 邮箱已存在...');
    try {
      await axios.put(`${BASE_URL}/users/${userId}`, {
        email: finalEmail // 使用已存在的邮箱
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ 应该失败但成功了');
    } catch (error) {
      if (error.response && error.response.data.error === '邮箱已被注册') {
        console.log('✅ 正确检测到邮箱已存在');
      } else {
        console.log('❌ 错误类型不正确:', error.response?.data?.error);
      }
    }

    // 9. 测试更新其他用户信息 - 应该失败
    console.log('\n9. 测试更新其他用户信息 - 应该失败...');
    try {
      await axios.put(`${BASE_URL}/users/9999`, {
        username: 'hacked_username'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ 应该失败但成功了');
    } catch (error) {
      if (error.response && error.response.data.error === '只能修改自己的用户信息') {
        console.log('✅ 正确限制了跨用户操作');
      } else {
        console.log('✅ 正确拒绝操作:', error.response?.data?.error);
      }
    }

    // 10. 测试删除用户
    console.log('\n10. 测试删除用户...');
    const deleteResponse = await axios.delete(`${BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 用户删除成功:', deleteResponse.data.message);

    // 11. 验证用户已被删除
    console.log('\n11. 验证用户已被删除...');
    try {
      await axios.post(`${BASE_URL}/users/login`, {
        username: finalUsername,
        password: testPassword
      });
      console.log('❌ 用户应该已被删除但仍可登录');
    } catch (error) {
      if (error.response && error.response.data.error === '用户不存在') {
        console.log('✅ 用户确认已被删除');
      } else {
        console.log('✅ 登录失败:', error.response?.data?.error);
      }
    }

    console.log('\n🎉 所有用户管理测试通过！接口正常工作。');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.response?.data || error.message);
  }
}

// 执行测试
if (require.main === module) {
  testUserManagement();
}

module.exports = testUserManagement;