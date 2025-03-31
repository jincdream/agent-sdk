/**
 * 示例意图处理器 - 天气查询意图
 */

import { Message } from '../../core/ContextManager';
import { AgentState } from '../../core/StateManager';
import { IntentHandler, IntentResult } from '../../core/IntentRecognizer';

/**
 * 天气意图处理器
 * 实现对天气查询相关意图的检测
 */
export class WeatherIntentHandler implements IntentHandler {
  /**
   * 处理用户输入，检测是否为天气查询意图
   * @param input 用户输入
   * @param context 上下文消息
   * @param state 当前状态
   * @returns 意图结果或null
   */
  async handle(input: string, context: Message[], state: AgentState): Promise<IntentResult | null> {
    // 将输入转为小写以便匹配
    const lowerInput = input.toLowerCase();
    
    // 首先检查是否是对天气的跟进问题（如"明天呢？"）
    if (this._isFollowUpQuestion(lowerInput, context)) {
      const previousCity = this._findPreviousCity(context);
      if (previousCity) {
        const dateResult = this._extractDate(lowerInput);
        return {
          intent: 'call_tool',
          tool: 'weather',
          parameters: {
            city: previousCity,
            ...(dateResult.found ? { date: dateResult.value } : {})
          },
          confidence: 0.85
        };
      }
    }
    
    // 简单的关键词匹配
    const weatherKeywords = ['天气', '气温', '下雨', '晴天', '阴天', '多云'];
    const hasWeatherKeyword = weatherKeywords.some(keyword => lowerInput.includes(keyword));
    
    if (!hasWeatherKeyword) {
      return null; // 不是天气相关意图
    }
    
    // 提取城市名称
    const cityResult = this._extractCity(lowerInput);
    
    // 提取日期
    const dateResult = this._extractDate(lowerInput);
    
    // 计算置信度
    let confidence = 0.5; // 基础置信度
    
    if (cityResult.found) {
      confidence += 0.3; // 找到城市提高置信度
    }
    
    if (dateResult.found) {
      confidence += 0.1; // 找到日期提高一点置信度
    }
    
    // 构建参数对象
    const parameters: Record<string, any> = {};
    
    if (cityResult.found) {
      parameters.city = cityResult.value;
    }
    
    if (dateResult.found) {
      parameters.date = dateResult.value;
    }
    
    // 返回意图结果
    return {
      intent: 'call_tool',
      tool: 'weather',
      parameters,
      confidence
    };
  }
  
  /**
   * 检查是否是天气跟进问题
   * @param input 用户输入
   * @param context 上下文
   * @returns 是否是跟进问题
   */
  private _isFollowUpQuestion(input: string, context: Message[]): boolean {
    // 检查是否是简短问题如"明天呢？"、"后天怎么样？"
    const followUpPatterns = [
      /明天(呢|怎么样|如何|天气)/,
      /后天(呢|怎么样|如何|天气)/,
      /周(一|二|三|四|五|六|日|末)(呢|怎么样|如何|天气)/
    ];
    
    if (followUpPatterns.some(pattern => pattern.test(input))) {
      // 检查上下文中是否有天气相关对话
      for (let i = context.length - 1; i >= 0; i--) {
        const msg = context[i];
        if (msg.role === 'system' && msg.content.includes('天气')) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 从上下文中找到最近提到的城市
   * @param context 上下文
   * @returns 城市名称或undefined
   */
  private _findPreviousCity(context: Message[]): string | undefined {
    for (let i = context.length - 1; i >= 0; i--) {
      const msg = context[i];
      if (msg.role === 'system' && msg.content.includes('执行结果')) {
        // 尝试从结果中提取城市名
        const cityMatch = msg.content.match(/工具 weather 执行结果: (.+?) .*?的天气/);
        if (cityMatch && cityMatch[1]) {
          return cityMatch[1].trim();
        }
      }
    }
    return undefined;
  }
  
  /**
   * 从输入中提取城市名称
   * @param input 用户输入
   * @returns 提取结果
   */
  private _extractCity(input: string): { found: boolean; value?: string } {
    // 常见城市列表（实际应用中可能会使用更复杂的地理信息库）
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安'];
    
    for (const city of cities) {
      if (input.includes(city)) {
        return { found: true, value: city };
      }
    }
    
    return { found: false };
  }
  
  /**
   * 从输入中提取日期
   * @param input 用户输入
   * @returns 提取结果
   */
  private _extractDate(input: string): { found: boolean; value?: string } {
    // 简单的日期模式匹配
    // 实际应用中可能会使用更复杂的NLP或正则表达式
    
    if (input.includes('今天')) {
      return { found: true, value: '今天' };
    }
    
    if (input.includes('明天')) {
      return { found: true, value: '明天' };
    }
    
    if (input.includes('后天')) {
      return { found: true, value: '后天' };
    }
    
    // 匹配YYYY-MM-DD格式的日期
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    const match = input.match(dateRegex);
    
    if (match) {
      return { found: true, value: match[0] };
    }
    
    return { found: false };
  }
} 