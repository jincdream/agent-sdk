/**
 * Agent SDK 示例演示
 */

import { Agent } from '../index';
import { WeatherTool } from './WeatherTool';
import { WeatherIntentHandler } from './intents/WeatherIntentHandler';

/**
 * 初始化 Agent
 */
async function initializeAgent() {
  // 创建 Agent 实例
  const agent = new Agent({
    name: '小助手',
    version: '1.0.0',
    description: '一个简单的智能助手，可以查询天气',
    minConfidence: 0.6,
    defaultPrompts: [
      {
        name: 'need_clarification',
        template: '我需要更多信息才能回答您的问题，请提供更多细节。'
      },
      {
        name: 'greeting',
        template: '您好！我是{{name}}，一个{{description}}。有什么可以帮您的吗？'
      }
    ]
  });
  
  // 注册工具
  const weatherTool = new WeatherTool();
  agent.registerTool(weatherTool);
  
  // 注册意图处理器
  const weatherIntentHandler = new WeatherIntentHandler();
  agent.intentRecognizer.registerIntent('weather_intent', weatherIntentHandler);
  
  return agent;
}

/**
 * 交互式对话示例
 */
async function interactiveDemo() {
  const agent = await initializeAgent();
  
  console.log('===== Agent SDK 演示 =====');
  console.log(`Agent: ${agent.getName()}, 版本: ${agent.getVersion()}`);
  console.log(`描述: ${agent.getDescription()}`);
  console.log('输入 "exit" 退出演示\n');
  
  // 模拟用户输入
  const userInputs = [
    '你好',
    '北京今天天气怎么样？',
    '明天呢？',
    '上海的天气呢？',
    '谢谢'
  ];
  
  for (const input of userInputs) {
    console.log(`用户: ${input}`);
    
    // 处理用户输入
    const response = await agent.handleMessage(input);
    
    // 输出 Agent 响应
    console.log(`Agent: ${response.content}`);
    
    // 输出调试信息
    if (response.intent) {
      console.log(`[调试] 意图: ${response.intent}`);
    }
    
    if (response.toolName) {
      console.log(`[调试] 工具: ${response.toolName}`);
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('===== 演示结束 =====');
}

// 运行演示
interactiveDemo().catch(error => {
  console.error('演示出错:', error);
});