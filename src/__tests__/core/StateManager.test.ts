/**
 * StateManager 测试文件
 */

import { StateManager, AgentState } from '../../core/StateManager';

describe('StateManager', () => {
  let stateManager: StateManager;
  
  beforeEach(() => {
    stateManager = new StateManager();
  });
  
  test('初始状态应为idle', () => {
    expect(stateManager.getState()).toBe('idle');
  });
  
  test('设置状态应正确更新', () => {
    const newState: AgentState = 'awaiting_user_input';
    stateManager.setState(newState);
    
    expect(stateManager.getState()).toBe(newState);
  });
  
  test('设置中断工具应正确存储', () => {
    const toolName = 'test_tool';
    stateManager.setInterruptedTool(toolName);
    
    expect(stateManager.getInterruptedTool()).toBe(toolName);
  });
  
  test('获取中断工具应返回正确值', () => {
    const toolName = 'test_tool';
    stateManager.setInterruptedTool(toolName);
    
    expect(stateManager.getInterruptedTool()).toBe(toolName);
  });
  
  test('当没有中断工具时，获取中断工具应返回null', () => {
    expect(stateManager.getInterruptedTool()).toBeNull();
  });
  
  test('当状态为waiting_for_xxx时，获取预期参数应返回正确值', () => {
    const waitingState: AgentState = 'waiting_for_name';
    stateManager.setState(waitingState);
    
    expect(stateManager.getExpectedParam()).toBe('name');
  });
  
  test('当状态不是waiting_for_xxx时，获取预期参数应返回null', () => {
    const nonWaitingState: AgentState = 'idle';
    stateManager.setState(nonWaitingState);
    
    expect(stateManager.getExpectedParam()).toBeNull();
  });
  
  test('重置状态应将状态恢复为idle并清除中断工具', () => {
    // 先设置一些状态
    stateManager.setState('executing_tool');
    stateManager.setInterruptedTool('test_tool');
    
    // 重置状态
    stateManager.resetState();
    
    // 验证状态已重置
    expect(stateManager.getState()).toBe('idle');
    expect(stateManager.getInterruptedTool()).toBeNull();
  });
}); 