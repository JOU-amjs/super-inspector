/*
 * @Date: 2019-11-30 09:39:42
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 10:41:58
 */
import { IDetailedRule, IErrorCollection, TBaseData, TErrorFunc, TErrorConverter, TFinalRule } from '../typings';
import { getConstructor, getRuleValidator } from './helper';
import { arrayErrorReports } from './validators/array';
import { objectErrorReports } from './validators/object';

// inspector检查错误前缀，用于判断抛出的错误是否为检查的数据错误，而非错误处理函数处理的语法错误
export const errorPrefix = '[$$InspectError]';

// 运行时错误前缀
const runtimeErrorPrefix = '[InspectorRuntime]';

// 创建错误抛出函数
export function createErrorThrower(errorHandler: TErrorConverter, rule: TFinalRule, key: string, value: any, depValue?: any) {
  return (extra?: any) => {
    let errMsg = createError(errorHandler, rule, key, value, extra, depValue);
    throw new Error(errMsg);
  }
}

// 创建错误消息
export function createError(errorHandler: TErrorConverter, rule: TFinalRule, key: string, value: any, extra?: any, depValue?: any) {
  return errorPrefix + (typeof errorHandler === 'function' ? (errorHandler as TErrorFunc)(value, rule, key, extra, depValue) : (errorHandler as string));
}

// 抛出带运行时前缀的错误
export function runtimeError(message: string): never {
  throw new Error(runtimeErrorPrefix + message);
}

// 默认的错误配置，可以通过新建对象覆盖
export const defaultErrors: IErrorCollection = {
  falsy: (_, rule, key) => `${(rule as IDetailedRule).label || key}为必填参数`,
  type: (value, rule, key) => {
    type TTypes = TBaseData|ArrayConstructor|undefined|null;
    let baseData = getRuleValidator(rule).validator as TTypes;
    const map = new Map<TTypes, string>();
    map.set(String, '字符串');
    map.set(Number, '数字');
    map.set(Function, '函数');
    map.set(Boolean, '布尔值');
    map.set(Object, '对象');
    map.set(Array, '数组');
    map.set(Symbol, 'symbol类型');
    map.set(undefined, 'undefined');
    map.set(null, 'null');
    return `${(rule as IDetailedRule).label || key}类型必须为${map.get(baseData)}，当前类型为${map.get(getConstructor(value))}`;
  },
  regexp: (value, rule, key) => `${(rule as IDetailedRule).label || key}值${value.toString()}与正则表达式${getRuleValidator(rule).validator}不匹配`,
  ...arrayErrorReports,
  ...objectErrorReports,
};