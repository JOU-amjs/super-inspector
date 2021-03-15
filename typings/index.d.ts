/*
 * @Date: 2020-10-31 13:09:27
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-15 17:00:55
 */
export type TBaseData = typeof String|typeof Number|typeof Function|typeof Boolean|typeof Object|typeof Symbol;
export type TErrorFunc = (value: any, rule: TFinalRule, key?: string, extra?: any, depValue?: any) => string;
export type TErrorConverter = string|TErrorFunc;
export interface IErrorCollection {
  falsy: TErrorConverter,
  type: TErrorConverter,
  regexp: TErrorConverter,
  notArray: TErrorConverter,
  arrayError: TErrorConverter,
  notObject: TErrorConverter,
  objectError: TErrorConverter,
  [key: string]: TErrorConverter,
};
type TErrorThrowFunc = (extra?: any) => never;
export interface IErrorThrowFunc {
  (message: string): never,
  
  falsy: TErrorThrowFunc,
  type: TErrorThrowFunc,
  regexp: TErrorThrowFunc,
  notArray: TErrorThrowFunc,
  arrayError: TErrorThrowFunc,
  notObject: TErrorThrowFunc,
  objectError: TErrorThrowFunc,
  [key: string]: TErrorThrowFunc,
}
export type TRawError = {key: string, error: string};
export interface IConfig<U> {
  errors: IErrorCollection,
  throwError: boolean,
  falsyValues: (''|0|-0|NaN|false|null|undefined)[],
  transformError?: (errors: TRawError[]) => U;
}
export type TFuncValidator = (this: IValidatorConstructor, value: any, rule: TFinalRule, key?: string, depValue?: any) => void|Promise<void>;
type TRule = TBaseData|RegExp|TFuncValidator;
interface IDetailedRule {
  required?: boolean,
  validator?: TRule,
  deps?: {[depKey: string]: TRule},
  error?: TErrorConverter,   // 如果有该值，将会以这个字符串抛出错误
  [x: string]: any,
}
export type TFinalRule = TRule|IDetailedRule;
interface IInspectRes<U> {
  code: 'ok'|'fail',
  error: U,
}

export default class InspectorConstructor<T = true, U = string> {
  public config: IConfig<U>;
  constructor(configExecutor?: (config: IConfig<U>) => IConfig<U>|void): void;
  public inspect(data: any, rule: TFinalRule): Promise<T extends true ? IInspectRes<U> : void>;
  public batchInspect(
    data: {[key: string]: any},
    rules: {[attr: string]: TFinalRule}
  ): Promise<T extends true ? IInspectRes<U> : void>;
  public affectedItems(
    data: {[key: string]: any},
    rules: {[attr: string]: TFinalRule}
  ): Promise<{[key: string]: boolean}>;
}
// 导出可用函数
export function $Array(...types: TFinalRule[]): TFuncValidator;
export function $Object(...types: TFinalRule[]): TFuncValidator;
export function $Union(...types: TFinalRule[]): TFuncValidator;
export interface IValidatorConstructor {
  public Inspector: typeof InspectorConstructor;
  public $Array: $Array;
  public $Object: $Object;
  public $Union: $Union;
  public $Intersect: $Intersect;
  public throw: IErrorThrowFunc;
  public config: IConfig;
}