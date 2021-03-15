/*
 * @Date: 2020-11-03 14:11:54
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:56:05
 */
import expect from 'expect.js';
import Inspector, { $Array, $Union, $Intersect } from "../src";

describe('ArrayInspctor', () => {
  it('简单类型数组', async () => {
    let sp = new Inspector<true>(config => {
      config.errors.regexp = (value, rule) => `值为${value}，与${rule}不匹配`;
    });
    // 数组内只能包含验证
    let res = await sp.inspect(['xabcd', 'egeabc'], $Array(/abc/));
    expect(res.code).to.equal('ok');
    res = await sp.inspect(['xabcd', 'egeabc'], $Array(/abcd/));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·数组下标`1`的值验证失败:值为egeabc，与/abcd/不匹配');
    
    res = await sp.batchInspect({ a: 1, b: [3, 4] }, {
      a: $Array(/abcd/),
      b: $Array(/4/),
    });
    expect(res.code).to.equal('fail');
    let errors = res.error.split('\n');
    expect(errors[0]).to.equal('·a不是数组');
    expect(errors[1]).to.equal('·数组b下标`0`的值验证失败:值为3，与/4/不匹配');
  });

  it('复杂类型数组', async () => {
    let sp = new Inspector<true>(config => {
      config.errors.regexp = (value, rule, key) => `${key}值为${value}，与${rule}不匹配`;
    });
    let res = await sp.inspect([
      { a: 2, b: 2 },
      { a: 3, b: 1 }
    ], $Array({ a: /2/, b: /2/ }));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·数组下标`1`的值验证失败:a值为3，与/2/不匹配;b值为1，与/2/不匹配');
  });
  
  it('数组与联合类型/交叉类型组合使用', async () => {
    let sp = new Inspector<true>(config => {
      config.errors.regexp = (value, rule, key) => `${key}值为${value}，与${rule}不匹配`;
    });
    let res = await sp.inspect(['aab', 'aac'], $Array($Union(/ad/, /ae/)));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·数组下标`0`的值验证失败:值为aab，与/ad/不匹配，且值为aab，与/ae/不匹配');
    
    res = await sp.inspect(['aab', 'aac'], $Array($Intersect(/aa/, /ab/)));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·数组下标`1`的值验证失败:值为aac，与/ab/不匹配');
  });
});