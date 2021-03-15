/*
 * @Date: 2019-11-29 18:10:38
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:44:46
 */
import { TFinalRule, TFuncValidator } from '../../typings';

// 联合类型，相当于 || 操作符
export default function $Union(...validators: TFinalRule[]) {
  return async function(value) {
    let scopedInspector = new this.Inspector(() => {
      return {
        ...this.config,
        transformError: errors => errors.map(({ error }) => error).join(';'),
        throwError: false,
      };
    });
    let errMsgs: string[] = [];
    for (let validator of validators) {
      let errMsg = (await scopedInspector.inspect(value, validator)).error;
      if (!errMsg) {
        return;
      }
      errMsgs.push(errMsg);
    }
    this.throw(errMsgs.join('，且'));
  } as TFuncValidator;
}