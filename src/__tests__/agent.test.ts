/**
 * Agent SDK 测试文件
 */

import { Agent, Tool } from '../index';

// 模拟工具
class MockTool implements Tool {
  name = 'mock';
  description = '测试用模拟工具';
  
  async execute(): Promise<string> {
    return '模拟工具执行结果';
  }
}

describe('Agent基础功能测试', () => {
  let agent: Agent;
  
  beforeEach(() => {
    // 在每个测试前创建新的Agent实例
    agent = new Agent({
      name: 'TestAgent',
      version: '1.0.0',
      description: '测试用Agent'
    });
    
    // 注册模拟工具
    agent.registerTool(new MockTool());
  });
  
  test('Agent初始化应正确设置基本属性', () => {
    expect(agent.getName()).toBe('TestAgent');
    expect(agent.getVersion()).toBe('1.0.0');
    expect(agent.getDescription()).toBe('测试用Agent');
  });
  
  test('Agent应能处理简单问候', async () => {
    const response = await agent.handleMessage('你好');
    
    // 默认情况下应返回闲聊响应
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
  });
  
  test('重置Agent状态应清空上下文', async () => {
    // 先处理一条消息
    await agent.handleMessage('测试消息');
    
    // 重置状态
    agent.reset();
    
    // 再处理一条消息
    const response = await agent.handleMessage('你好');
    
    // 应正常响应
    expect(response).toBeDefined();
  });
}); 