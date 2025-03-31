/**
 * 示例工具 - 天气查询
 */

import { Tool, JSONSchema } from '../core/ToolManager';

/**
 * 天气查询工具
 * 示例实现，实际使用时应对接真实的天气API
 */
export class WeatherTool implements Tool {
  name = 'weather';
  description = '查询指定城市的天气信息';
  
  // 定义参数Schema
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '城市名称，如"北京"、"上海"等'
      },
      date: {
        type: 'string',
        description: '查询日期，默认为今天，格式为YYYY-MM-DD'
      }
    },
    required: ['city']
  };
  
  /**
   * 执行天气查询
   * @param args 参数对象，包含city和可选的date
   * @returns 天气查询结果
   */
  async execute(args: { city: string; date?: string }): Promise<string> {
    const { city, date = '今天' } = args;
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟天气数据
    const weather = this._getRandomWeather();
    const temperature = this._getRandomTemperature();
    
    return `${city} ${date}的天气: ${weather}, 温度 ${temperature}°C`;
  }
  
  /**
   * 生成随机天气
   * @returns 天气描述
   */
  private _getRandomWeather(): string {
    const weatherTypes = ['晴朗', '多云', '阴天', '小雨', '大雨', '雷阵雨', '雾霾'];
    const index = Math.floor(Math.random() * weatherTypes.length);
    return weatherTypes[index];
  }
  
  /**
   * 生成随机温度
   * @returns 温度值
   */
  private _getRandomTemperature(): number {
    return Math.floor(Math.random() * 30) + 5; // 5到35度之间
  }
} 