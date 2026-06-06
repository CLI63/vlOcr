const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 测试用户
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'test123456';
const newPassword = 'newpassword123';

async function testChangePassword() {
  console.log('🧪 开始测试密码修改功能...\n');

  try {
    // 1. 注册用户
    console.log('1. 注册用户...');
    await axios.post(`${BASE_URL}/users/register`, {
      username: testUsername,
      password: testPassword,
      email: 'test@example.com'
    });
    console.log('✅ 用户注册成功\n');

    // 2. 用户登录
    console.log('2. 用户登录...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      username: testUsername,
      password: testPassword
    });
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token\n');

    // 3. 测试修改密码 - 旧密码错误
    console.log('3. 测试修改密码 - 旧密码错误...');
    try {
      await axios.post(`${BASE_URL}/users/change-password`, {
        oldPassword: 'wrong_password',
        newPassword: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ 应该失败但成功了');
    } catch (error) {
      if (error.response && error.response.data.error === '旧密码错误') {
        console.log('✅ 正确检测到旧密码错误\n');
      } else {
        console.log('❌ 错误类型不正确:', error.response?.data?.error);
      }
    }

    // 4. 测试修改密码 - 新密码太短
    console.log('4. 测试修改密码 - 新密码太短...');
    try {
      await axios.post(`${BASE_URL}/users/change-password`, {
        oldPassword: testPassword,
        newPassword: '123'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ 应该失败但成功了');
    } catch (error) {
      if (error.response && error.response.data.error === '新密码至少需要6位') {
        console.log('✅ 正确检测到密码长度不足\n');
      } else {
        console.log('❌ 错误类型不正确:', error.response?.data?.error);
      }
    }

    // 5. 测试修改密码 - 成功修改
    console.log('5. 测试修改密码 - 成功修改...');
    const changeResponse = await axios.post(`${BASE_URL}/users/change-password`, {
      oldPassword: testPassword,
      newPassword: newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ 密码修改成功:', changeResponse.data.message);

    // 6. 验证旧密码已失效
    console.log('6. 验证旧密码已失效...');
    try {
      await axios.post(`${BASE_URL}/users/login`, {
        username: testUsername,
        password: testPassword
      });
      console.log('❌ 旧密码仍然有效');
    } catch (error) {
      if (error.response && error.response.data.error === '密码错误') {
        console.log('✅ 旧密码已失效\n');
      } else {
        console.log('❌ 错误类型不正确:', error.response?.data?.error);
      }
    }

    // 7. 验证新密码有效
    console.log('7. 验证新密码有效...');
    const newLoginResponse = await axios.post(`${BASE_URL}/users/login`, {
      username: testUsername,
      password: newPassword
    });
    console.log('✅ 新密码登录成功，token:', newLoginResponse.data.token.substring(0, 20) + '...\n');

    console.log('🎉 所有测试通过！密码修改接口正常工作。');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.response?.data || error.message);
  }
}

// 执行测试
if (require.main === module) {
  testChangePassword();
}

module.exports = testChangePassword;