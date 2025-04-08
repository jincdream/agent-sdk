/**
 * IntentRecognizer 测试文件
 */

import { IntentRecognizer, IntentResult, IntentHandler } from '../../core/IntentRecognizer';
import { Message } from '../../core/ContextManager';
import { AgentState } from '../../core/StateManager';
import { Tool } from '../../core/ToolManager';

// 模拟意图处理器
class MockIntentHandler implements IntentHandler {
  private intent: string;
  private confidence: number;
  private tool?: string;
  private parameters?: Record<string, any>;
  private shouldThrow: boolean = false;
  
  constructor(intent: string, confidence: number, tool?: string, parameters?: Record<string, any>, shouldThrow: boolean = false) {
    this.intent = intent;
    this.confidence = confidence;
    this.tool = tool;
    this.parameters = parameters;
    this.shouldThrow = shouldThrow;
  }
  
  async handle(input: string, context: Message[], state: AgentState): Promise<IntentResult | null> {
    if (this.shouldThrow) {
      throw new Error('模拟处理器错误');
    }
    
    return {
      intent: this.intent as any,
      tool: this.tool,
      parameters: this.parameters,
      confidence: this.confidence
    };
  }
}

describe('IntentRecognizer', () => {
  let recognizer: IntentRecognizer;
  let mockContext: Message[];
  let mockState: AgentState;
  
  beforeEach(() => {
    recognizer = new IntentRecognizer();
    mockContext = [
      { role: 'user', content: '测试消息', timestamp: Date.now() }
    ];
    mockState = 'idle';
  });
  
  test('构造函数应正确初始化', () => {
    expect(recognizer).toBeDefined();
    
    // 测试自定义选项
    const customRecognizer = new IntentRecognizer({
      minConfidence: 0.5,
      customHandlers: new Map([
        ['test_intent', new MockIntentHandler('test_intent', 0.8)]
      ])
    });
    
    expect(customRecognizer).toBeDefined();
  });
  
  test('构造函数应正确处理默认值', async () => {
    // 测试不传递任何选项
    const defaultRecognizer = new IntentRecognizer();
    const result = await defaultRecognizer.detectIntent('测试输入', mockContext, mockState);
    expect(result.intent).toBe('chit_chat');
    expect(result.confidence).toBe(0.5);
    
    // 测试只传递minConfidence
    const confidenceRecognizer = new IntentRecognizer({ minConfidence: 0.3 });
    confidenceRecognizer.registerIntent('low_confidence', new MockIntentHandler('low_confidence', 0.4));
    const confidenceResult = await confidenceRecognizer.detectIntent('测试输入', mockContext, mockState);
    expect(confidenceResult.intent).toBe('low_confidence');
    expect(confidenceResult.confidence).toBe(0.4);
    
    // 测试只传递customHandlers
    const handlersRecognizer = new IntentRecognizer({
      customHandlers: new Map([
        ['custom_intent', new MockIntentHandler('custom_intent', 0.8)]
      ])
    });
    const handlersResult = await handlersRecognizer.detectIntent('测试输入', mockContext, mockState);
    expect(handlersResult.intent).toBe('custom_intent');
    expect(handlersResult.confidence).toBe(0.8);
  });
  
  test('构造函数应正确处理空的customHandlers', async () => {
    // 测试传递空的customHandlers
    const emptyHandlersRecognizer = new IntentRecognizer({
      customHandlers: new Map()
    });
    const result = await emptyHandlersRecognizer.detectIntent('测试输入', mockContext, mockState);
    expect(result.intent).toBe('chit_chat');
    expect(result.confidence).toBe(0.5);
  });
  
  test('注册意图处理器应正常工作', () => {
    const handler = new MockIntentHandler('test_intent', 0.8);
    recognizer.registerIntent('test_intent', handler);
    
    // 由于没有公开方法检查注册的处理器，我们通过检测意图来间接验证
    // 这部分测试将在 detectIntent 测试中完成
  });
  
  test('检测意图应返回正确结果', async () => {
    // 注册一个高置信度的处理器
    recognizer.registerIntent('high_confidence', new MockIntentHandler('high_confidence', 0.9));
    
    // 注册一个低置信度的处理器
    recognizer.registerIntent('low_confidence', new MockIntentHandler('low_confidence', 0.3));
    
    const result = await recognizer.detectIntent('测试输入', mockContext, mockState);
    
    // 应该返回高置信度的意图
    expect(result.intent).toBe('high_confidence');
    expect(result.confidence).toBe(0.9);
  });
  
  test('当没有匹配意图时应返回闲聊意图', async () => {
    // 不注册任何处理器
    const result = await recognizer.detectIntent('测试输入', mockContext, mockState);
    
    expect(result.intent).toBe('chit_chat');
    expect(result.confidence).toBe(0.5);
  });
  
  test('当处于等待状态时应优先考虑继续流程意图', async () => {
    const waitingState: AgentState = 'waiting_for_name';
    
    const result = await recognizer.detectIntent('张三', mockContext, waitingState);
    
    expect(result.intent).toBe('continue_flow');
    expect(result.parameters).toBeDefined();
    expect(result.parameters?.name).toBe('张三');
    expect(result.confidence).toBe(0.9);
  });
  
  test('获取工具匹配应返回正确结果', async () => {
    const mockTools: Tool[] = [
      {
        name: 'search',
        description: '搜索信息',
        execute: async () => '搜索结果'
      },
      {
        name: 'calculator',
        description: '计算数学表达式',
        execute: async () => '计算结果'
      }
    ];
    
    // 测试包含工具名称的输入
    const nameMatches = await recognizer.getToolMatches('使用search工具', mockTools);
    expect(nameMatches[0].name).toBe('search');
    expect(nameMatches[0].confidence).toBeGreaterThan(0.5);
    
    // 测试包含工具描述的输入
    const descMatches = await recognizer.getToolMatches('帮我计算数学表达式', mockTools);
    expect(descMatches[0].name).toBe('calculator');
    expect(descMatches[0].confidence).toBeGreaterThan(0.5);
  });
  
  test('当意图处理器抛出错误时应继续处理其他处理器', async () => {
    // 注册一个会抛出错误的处理器
    recognizer.registerIntent('error_handler', new MockIntentHandler('error_handler', 0.8, undefined, undefined, true));
    
    // 注册一个正常的处理器
    recognizer.registerIntent('normal_handler', new MockIntentHandler('normal_handler', 0.9));
    
    const result = await recognizer.detectIntent('测试输入', mockContext, mockState);
    
    // 应该返回正常处理器的结果
    expect(result.intent).toBe('normal_handler');
    expect(result.confidence).toBe(0.9);
  });
  
  test('当状态不是waiting_for_开头时，_checkContinueFlow应返回null', async () => {
    // 使用非waiting_for_开头的状态
    const nonWaitingState: AgentState = 'idle';
    
    // 直接调用_checkContinueFlow方法
    const result = await (recognizer as any)._checkContinueFlow('测试输入', mockContext, nonWaitingState);
    
    // 应该返回null
    expect(result).toBeNull();
  });
  
  // 添加一个测试，专门测试_checkContinueFlow方法的行为
  test('_checkContinueFlow方法应正确处理非waiting_for_状态', async () => {
    // 使用非waiting_for_开头的状态
    const nonWaitingState: AgentState = 'idle';
    
    // 由于_checkContinueFlow是私有方法，我们需要通过反射或其他方式访问它
    // 这里我们通过修改IntentRecognizer类来添加一个公共方法，用于测试目的
    const testRecognizer = new IntentRecognizer();
    
    // 使用一个特殊的状态，确保_checkContinueFlow方法被调用但返回null
    const result = await testRecognizer.detectIntent('测试输入', mockContext, nonWaitingState);
    
    // 由于没有注册任何处理器，应该返回闲聊意图
    expect(result.intent).toBe('chit_chat');
    
    // 为了确保_checkContinueFlow方法被调用，我们可以注册一个处理器，但置信度低于阈值
    testRecognizer.registerIntent('low_confidence', new MockIntentHandler('low_confidence', 0.3));
    
    // 再次调用detectIntent，确保_checkContinueFlow方法被调用
    const result2 = await testRecognizer.detectIntent('测试输入', mockContext, nonWaitingState);
    
    // 由于处理器置信度低于阈值，应该返回闲聊意图
    expect(result2.intent).toBe('chit_chat');
  });
  
  test('_checkContinueFlow方法应正确处理waiting_for_状态', async () => {
    // 使用waiting_for_开头的状态
    const waitingState: AgentState = 'waiting_for_name';
    
    // 直接调用_checkContinueFlow方法
    const result = await (recognizer as any)._checkContinueFlow('张三', mockContext, waitingState);
    
    // 应该返回continue_flow意图，并包含参数
    expect(result).not.toBeNull();
    expect(result.intent).toBe('continue_flow');
    expect(result.parameters).toBeDefined();
    expect(result.parameters?.name).toBe('张三');
    expect(result.confidence).toBe(0.9);
  });
  
  test('_checkContinueFlow方法应正确处理空参数名', async () => {
    // 使用waiting_for_而没有其他字符的状态
    const emptyParamState: AgentState = 'waiting_for_';
    
    // 直接调用_checkContinueFlow方法
    const result = await (recognizer as any)._checkContinueFlow('测试输入', mockContext, emptyParamState);
    
    // 应该返回continue_flow意图，但参数名为空字符串
    expect(result).not.toBeNull();
    expect(result.intent).toBe('continue_flow');
    expect(result.parameters).toBeDefined();
    expect(result.parameters?.['']).toBe('测试输入');
    expect(result.confidence).toBe(0.9);
  });
  
  test('MockIntentHandler的handle方法应正确返回意图结果', async () => {
    const handler = new MockIntentHandler('test_intent', 0.8, 'test_tool', { param: 'value' });
    
    const result = await handler.handle('测试输入', mockContext, mockState);
    
    expect(result).not.toBeNull();
    expect(result?.intent).toBe('test_intent');
    expect(result?.confidence).toBe(0.8);
    expect(result?.tool).toBe('test_tool');
    expect(result?.parameters).toEqual({ param: 'value' });
  });
  
  test('MockIntentHandler的handle方法在shouldThrow为true时应抛出错误', async () => {
    const handler = new MockIntentHandler('error_intent', 0.8, undefined, undefined, true);
    
    await expect(handler.handle('测试输入', mockContext, mockState)).rejects.toThrow('模拟处理器错误');
  });
  
  test('MockIntentHandler的handle方法应支持可选参数', async () => {
    // 测试只有必需参数的情况
    const basicHandler = new MockIntentHandler('basic_intent', 0.8);
    const basicResult = await basicHandler.handle('测试输入', mockContext, mockState);
    expect(basicResult?.tool).toBeUndefined();
    expect(basicResult?.parameters).toBeUndefined();
    
    // 测试只有tool参数的情况
    const toolHandler = new MockIntentHandler('tool_intent', 0.8, 'test_tool');
    const toolResult = await toolHandler.handle('测试输入', mockContext, mockState);
    expect(toolResult?.tool).toBe('test_tool');
    expect(toolResult?.parameters).toBeUndefined();
    
    // 测试只有parameters参数的情况
    const paramHandler = new MockIntentHandler('param_intent', 0.8, undefined, { test: 'value' });
    const paramResult = await paramHandler.handle('测试输入', mockContext, mockState);
    expect(paramResult?.tool).toBeUndefined();
    expect(paramResult?.parameters).toEqual({ test: 'value' });
  });
  
  test('工具匹配应正确处理排序和映射', async () => {
    const mockTools: Tool[] = [
      {
        name: 'low_match',
        description: '低匹配度工具',
        execute: async () => '结果'
      },
      {
        name: 'high_match',
        description: '这是一个high_match工具',
        execute: async () => '结果'
      }
    ];
    
    // 测试包含工具名称的输入，确保排序正确
    const matches = await recognizer.getToolMatches('使用high_match工具', mockTools);
    expect(matches).toHaveLength(2);
    expect(matches[0].name).toBe('high_match');
    expect(matches[0].confidence).toBeGreaterThan(matches[1].confidence);
    
    // 测试完全不匹配的情况，确保映射函数正确处理
    const noMatches = await recognizer.getToolMatches('完全不相关的输入', mockTools);
    expect(noMatches).toHaveLength(2);
    expect(noMatches[0].confidence).toBeLessThan(0.5);
    expect(noMatches[1].confidence).toBeLessThan(0.5);
  });
  
  test('getToolMatches方法中的箭头函数应正确工作', async () => {
    const mockTools: Tool[] = [
      {
        name: 'tool1',
        description: '工具1的描述',
        execute: async () => '结果1'
      },
      {
        name: 'tool2',
        description: '工具2的描述',
        execute: async () => '结果2'
      },
      {
        name: 'tool3',
        description: '工具3的描述',
        execute: async () => '结果3'
      }
    ];
    
    // 测试map函数 - 名称匹配
    const nameMatches = await recognizer.getToolMatches('使用tool2', mockTools);
    expect(nameMatches).toHaveLength(3);
    const tool2Match = nameMatches.find(m => m.name === 'tool2');
    expect(tool2Match?.confidence).toBe(0.8);
    
    // 测试map函数 - 描述匹配
    const descMatches = await recognizer.getToolMatches('工具2的描述', mockTools);
    expect(descMatches).toHaveLength(3);
    const tool2DescMatch = descMatches.find(m => m.name === 'tool2');
    expect(tool2DescMatch?.confidence).toBe(0.6);
    
    // 测试sort函数
    const sortedMatches = nameMatches.slice().sort((a, b) => b.confidence - a.confidence);
    expect(sortedMatches[0].confidence).toBeGreaterThanOrEqual(sortedMatches[1].confidence);
    expect(sortedMatches[1].confidence).toBeGreaterThanOrEqual(sortedMatches[2].confidence);
    
    // 测试完全不匹配的情况
    const noMatches = await recognizer.getToolMatches('完全不相关', mockTools);
    expect(noMatches).toHaveLength(3);
    expect(noMatches.every(m => m.confidence === 0.1)).toBe(true);
  });
  
  describe('MockIntentHandler', () => {
    test('handle方法应正确返回意图结果', async () => {
      const handler = new MockIntentHandler(
        'test_intent',
        0.8,
        'test_tool',
        { param: 'value' }
      );
      
      const result = await handler.handle('测试输入', mockContext, mockState);
      
      expect(result).not.toBeNull();
      expect(result?.intent).toBe('test_intent');
      expect(result?.confidence).toBe(0.8);
      expect(result?.tool).toBe('test_tool');
      expect(result?.parameters).toEqual({ param: 'value' });
    });
    
    test('handle方法在shouldThrow为true时应抛出错误', async () => {
      const handler = new MockIntentHandler(
        'error_intent',
        0.8,
        undefined,
        undefined,
        true
      );
      
      await expect(handler.handle('测试输入', mockContext, mockState)).rejects.toThrow('模拟处理器错误');
    });
    
    test('handle方法应支持可选参数', async () => {
      // 测试只有必需参数的情况
      const basicHandler = new MockIntentHandler('basic_intent', 0.8);
      const basicResult = await basicHandler.handle('测试输入', mockContext, mockState);
      expect(basicResult?.tool).toBeUndefined();
      expect(basicResult?.parameters).toBeUndefined();
      
      // 测试只有tool参数的情况
      const toolHandler = new MockIntentHandler('tool_intent', 0.8, 'test_tool');
      const toolResult = await toolHandler.handle('测试输入', mockContext, mockState);
      expect(toolResult?.tool).toBe('test_tool');
      expect(toolResult?.parameters).toBeUndefined();
      
      // 测试只有parameters参数的情况
      const paramHandler = new MockIntentHandler('param_intent', 0.8, undefined, { test: 'value' });
      const paramResult = await paramHandler.handle('测试输入', mockContext, mockState);
      expect(paramResult?.tool).toBeUndefined();
      expect(paramResult?.parameters).toEqual({ test: 'value' });
    });
  });
});

describe('getToolMatches方法', () => {
  it('应该正确计算工具匹配度', async () => {
    const recognizer = new IntentRecognizer();
    const mockTools: Tool[] = [
      { 
        name: 'weather', 
        description: '查询天气',
        execute: async () => '天气查询结果'
      },
      { 
        name: 'calendar', 
        description: '日历管理',
        execute: async () => '日历管理结果'
      }
    ];

    const input = '查询北京的天气';
    const matches = await recognizer.getToolMatches(input, mockTools);

    expect(matches).toHaveLength(2);
    expect(matches[0].name).toBe('weather');
    expect(matches[0].confidence).toBeGreaterThan(matches[1].confidence);
  });

  it('当没有匹配时应该返回较低的置信度', async () => {
    const recognizer = new IntentRecognizer();
    const mockTools: Tool[] = [
      { 
        name: 'weather', 
        description: '查询天气',
        execute: async () => '天气查询结果'
      }
    ];

    const input = '完全不相关的输入';
    const matches = await recognizer.getToolMatches(input, mockTools);

    expect(matches[0].confidence).toBeLessThan(0.5);
  });
});

describe('registerIntent方法', () => {
  it('应该正确注册意图处理器', async () => {
    const recognizer = new IntentRecognizer();
    const mockHandler = new MockIntentHandler('test_intent', 0.8);

    recognizer.registerIntent('test_intent', mockHandler);
    
    // 通过detectIntent间接测试注册是否成功
    const result = await recognizer.detectIntent('测试输入', [], 'idle');
    expect(result).toBeDefined();
    expect(result.intent).toBe('test_intent');
  });

  it('应该允许覆盖已注册的意图处理器', async () => {
    const recognizer = new IntentRecognizer();
    const handler1 = new MockIntentHandler('test_intent', 0.8);
    const handler2 = new MockIntentHandler('test_intent', 0.9);

    recognizer.registerIntent('test_intent', handler1);
    recognizer.registerIntent('test_intent', handler2);

    // 通过detectIntent间接测试是否使用了新的处理器
    const result = await recognizer.detectIntent('测试输入', [], 'idle');
    expect(result).toBeDefined();
    expect(result.intent).toBe('test_intent');
    expect(result.confidence).toBe(0.9);
  });
}); 