/*
 * @Date: 2020-11-03 14:22:10
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 13:49:30
 */
import expect from 'expect.js';
import Inspector, { $Object } from "../src";

describe('ObjectInspctor', () => {
  it('简单类型对象', async () => {
    let sp = new Inspector(config => {
      config.errors.regexp = (value, rule) => `值为${value}，与${rule}不匹配`;
    });
    // 数组内只能包含验证
    let res = await sp.inspect({
      a: 'xabcd',
      b: 'egeabc'
    }, $Object(/abc/));
    expect(res.code).to.equal('ok');
    res = await sp.inspect({
      a: 'xabcd',
      b: 'egeabc'
    }, $Object(/abcd/));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·对象属性为\`b\`的值验证失败:值为egeabc，与/abcd/不匹配');
    res = await sp.inspect('xabcd', $Object(/abcd/));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·不是对象');
  });

  it('复杂类型对象', async () => {
    let sp = new Inspector(config => {
      config.errors.regexp = (value, rule, key) => `${key}值为${value}，与${rule}不匹配`;
    });
    let res = await sp.inspect({
      a1: { a: 1, b: 2 },
      b1: { a: 2, b: 1 }
    }, $Object({ a: /2/, b: /3/ }));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·对象属性为\`a1\`的值验证失败:a值为1，与/2/不匹配;b值为2，与/3/不匹配');
  });
});