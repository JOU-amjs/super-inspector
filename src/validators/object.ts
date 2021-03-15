/*
 * @Date: 2019-11-29 21:44:49
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:36:33
 */
import { IDetailedRule, TErrorConverter, TFinalRule, TFuncValidator } from '../../typings';
import { getConstructor } from '../helper';

type TFinalRules = {[attr: string]: TFinalRule};
export default function $Object(validator: TFinalRule|TFinalRules) {
  return async function(value) {
    if (typeof value !== 'object') {
      this.throw.notObject();
    }

    let scopedInspector = new this.Inspector(() => {
      return {
        ...this.config,
        throwError: false,
        transformError: errors => errors.map(({ error }) => error).join(';'),
      };
    });
    for (let attr in value) {
      const valItem = value[attr];
      let errMsg = '';
      if (getConstructor(validator) === Object) {
        errMsg = (await scopedInspector.batchInspect(valItem, validator as TFinalRules)).error;
      }
      else {
        errMsg = (await scopedInspector.inspect(valItem, validator)).error;
      }
      if (errMsg) {
        this.throw.objectError({ attr, errMsg });
        break;
      }
    }
  } as TFuncValidator;
}
export const objectErrorReports = {
  notObject: ((_, rule, key) => `${(rule as IDetailedRule).label || key}不是对象`) as TErrorConverter,
  objectError: ((_, rule, key, { attr, errMsg }: { attr: string, errMsg: string }) => {
    return `对象${(rule as IDetailedRule).label || key}属性为\`${attr}\`的值验证失败:${errMsg}`;
  }) as TErrorConverter,
};