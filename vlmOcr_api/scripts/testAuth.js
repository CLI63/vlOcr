const axios = require('axios');

const baseURL = 'http://localhost:3001';
const api = axios.create({ baseURL });

async function testAuth() {
    try {
        console.log('开始测试用户认证功能...');
        
        const timestamp = Date.now();
        const testUsername = `testuser${timestamp}`;
        const testEmail = `test${timestamp}@example.com`;
        
        // 测试用户注册
        console.log('\n1. 测试用户注册...');
        const registerResponse = await api.post('/users/register', {
            username: testUsername,
            password: '123456',
            email: testEmail
        });
        console.log('注册成功:', registerResponse.data);
        
        // 测试用户登录
        console.log('\n2. 测试用户登录...');
        const loginResponse = await api.post('/users/login', {
            username: testUsername,
            password: '123456'
        });
        console.log('登录成功:', loginResponse.data);
        
        const token = loginResponse.data.token;
        
        // 测试获取用户信息
        console.log('\n3. 测试获取用户信息...');
        const userResponse = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('用户信息:', userResponse.data);
        
        // 测试未授权访问
        console.log('\n4. 测试未授权访问...');
        try {
            await api.get('/api/models');
            console.log('ERROR: 应该被拒绝访问');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('SUCCESS: 未授权访问被正确拒绝');
            } else {
                console.log('ERROR: 意外的错误:', error.message);
            }
        }
        
        // 测试使用token访问受保护路由
        console.log('\n5. 测试使用token访问受保护路由...');
        try {
            const protectedResponse = await api.get('/api/models', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('SUCCESS: 使用token成功访问受保护路由');
        } catch (error) {
            console.log('ERROR: 访问受保护路由失败:', error.response ? error.response.data : error.message);
        }
        
        console.log('\n所有测试完成!');
    } catch (error) {
        console.error('测试过程中出现错误:', error.response ? error.response.data : error.message);
    }
}

testAuth();