/**
 * ToolManager 测试文件
 */

import { ToolManager, Tool, JSONSchema } from '../../core/ToolManager';

describe('ToolManager', () => {
  let toolManager: ToolManager;
  
  // 模拟工具
  const mockTool: Tool = {
    name: 'mock_tool',
    description: '测试用模拟工具',
    execute: async () => '模拟工具执行结果'
  };
  
  // 带参数的工具
  const paramTool: Tool = {
    name: 'param_tool',
    description: '带参数的工具',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    },
    execute: async (args) => `你好，${args.name}，年龄：${args.age || '未知'}`
  };
  
  beforeEach(() => {
    toolManager = new ToolManager();
  });
  
  test('注册工具应正确存储', () => {
    toolManager.registerTool(mockTool);
    
    const tools = toolManager.getAllTools();
    expect(tools.length).toBe(1);
    expect(tools[0]).toEqual(mockTool);
  });
  
  test('注销工具应正确移除', () => {
    toolManager.registerTool(mockTool);
    toolManager.unregisterTool(mockTool.name);
    
    const tools = toolManager.getAllTools();
    expect(tools.length).toBe(0);
  });
  
  test('执行工具应返回正确结果', async () => {
    toolManager.registerTool(mockTool);
    
    const result = await toolManager.executeTool(mockTool.name, {});
    
    expect(result.success).toBe(true);
    expect(result.result).toBe('模拟工具执行结果');
  });
  
  test('执行不存在的工具应返回错误', async () => {
    const result = await toolManager.executeTool('non_existent_tool', {});
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('工具 non_existent_tool 不存在');
  });
  
  test('执行带参数的工具应正确传递参数', async () => {
    toolManager.registerTool(paramTool);
    
    const result = await toolManager.executeTool(paramTool.name, {
      name: '张三',
      age: 25
    });
    
    expect(result.success).toBe(true);
    expect(result.result).toBe('你好，张三，年龄：25');
  });
  
  test('执行带参数的工具但缺少必需参数应返回错误', async () => {
    toolManager.registerTool(paramTool);
    
    const result = await toolManager.executeTool(paramTool.name, {
      age: 25
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('缺少必要参数');
    expect(result.missingParams).toContain('name');
  });
  
  test('获取工具模式定义应返回正确值', () => {
    toolManager.registerTool(paramTool);
    
    const schema = toolManager.getToolSchema(paramTool.name);
    
    expect(schema).toBeDefined();
    expect(schema).toEqual(paramTool.parameters);
  });
  
  test('获取不存在的工具模式定义应返回undefined', () => {
    const schema = toolManager.getToolSchema('non_existent_tool');
    
    expect(schema).toBeUndefined();
  });
  
  test('获取所有工具应返回所有注册的工具', () => {
    toolManager.registerTool(mockTool);
    toolManager.registerTool(paramTool);
    
    const tools = toolManager.getAllTools();
    
    expect(tools.length).toBe(2);
    expect(tools).toContainEqual(mockTool);
    expect(tools).toContainEqual(paramTool);
  });
  
  test('工具执行出错时应返回错误信息', async () => {
    const errorTool: Tool = {
      name: 'error_tool',
      description: '会抛出错误的工具',
      execute: async () => {
        throw new Error('工具执行错误');
      }
    };
    
    toolManager.registerTool(errorTool);
    
    const result = await toolManager.executeTool(errorTool.name, {});
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('工具执行错误');
  });
  
  test('工具执行抛出非Error对象时应返回未知错误', async () => {
    const nonErrorTool: Tool = {
      name: 'non_error_tool',
      description: '会抛出非Error对象的工具',
      execute: async () => {
        throw '字符串错误';
      }
    };
    
    toolManager.registerTool(nonErrorTool);
    
    const result = await toolManager.executeTool(nonErrorTool.name, {});
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('未知错误');
  });
}); 