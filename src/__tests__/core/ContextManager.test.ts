/**
 * ContextManager 测试文件
 */

import { ContextManager, Message } from '../../core/ContextManager';

describe('ContextManager', () => {
  let contextManager: ContextManager;
  
  beforeEach(() => {
    contextManager = new ContextManager();
  });
  
  test('添加消息应正确存储', () => {
    const message: Message = {
      role: 'user',
      content: '测试消息',
      timestamp: Date.now()
    };
    
    contextManager.addMessage(message);
    const context = contextManager.getContext();
    
    expect(context.length).toBe(1);
    expect(context[0]).toEqual(message);
  });
  
  test('获取上下文应返回所有消息', () => {
    const messages: Message[] = [
      { role: 'user', content: '用户消息1', timestamp: Date.now() },
      { role: 'agent', content: '代理消息1', timestamp: Date.now() },
      { role: 'user', content: '用户消息2', timestamp: Date.now() }
    ];
    
    for (const message of messages) {
      contextManager.addMessage(message);
    }
    
    const context = contextManager.getContext();
    expect(context.length).toBe(3);
    expect(context).toEqual(messages);
  });
  
  test('获取上下文时应支持最大消息数限制', () => {
    const messages: Message[] = [
      { role: 'user', content: '用户消息1', timestamp: Date.now() },
      { role: 'agent', content: '代理消息1', timestamp: Date.now() },
      { role: 'user', content: '用户消息2', timestamp: Date.now() },
      { role: 'agent', content: '代理消息2', timestamp: Date.now() },
      { role: 'user', content: '用户消息3', timestamp: Date.now() }
    ];
    
    for (const message of messages) {
      contextManager.addMessage(message);
    }
    
    // 限制为最后3条消息
    const limitedContext = contextManager.getContext(3);
    expect(limitedContext.length).toBe(3);
    expect(limitedContext).toEqual(messages.slice(-3));
  });
  
  test('清空上下文应移除所有消息', () => {
    const messages: Message[] = [
      { role: 'user', content: '用户消息1', timestamp: Date.now() },
      { role: 'agent', content: '代理消息1', timestamp: Date.now() }
    ];
    
    for (const message of messages) {
      contextManager.addMessage(message);
    }
    
    contextManager.clearContext();
    const context = contextManager.getContext();
    
    expect(context.length).toBe(0);
  });
  
  test('保存工具参数应正确存储', () => {
    const toolName = 'test_tool';
    const args = { param1: 'value1', param2: 123 };
    
    contextManager.saveToolArgs(toolName, args);
    
    expect(contextManager.getLastToolName()).toBe(toolName);
    expect(contextManager.getLastToolArgs()).toEqual(args);
  });
  
  test('获取最后工具参数应返回正确值', () => {
    const toolName = 'test_tool';
    const args = { param1: 'value1', param2: 123 };
    
    contextManager.saveToolArgs(toolName, args);
    
    const lastToolName = contextManager.getLastToolName();
    const lastToolArgs = contextManager.getLastToolArgs();
    
    expect(lastToolName).toBe(toolName);
    expect(lastToolArgs).toEqual(args);
  });
  
  test('当没有工具调用时，获取最后工具名称应返回null', () => {
    expect(contextManager.getLastToolName()).toBeNull();
  });
  
  test('当没有工具调用时，获取最后工具参数应返回空对象', () => {
    expect(contextManager.getLastToolArgs()).toEqual({});
  });
}); 