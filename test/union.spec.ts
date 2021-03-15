/*
 * @Date: 2020-11-03 14:11:54
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:58:35
 */
import expect from 'expect.js';
import Inspector, { $Union } from "../src";
import { IDetailedRule } from '../typings';

describe('$Union', () => {
  it('联合验证简单类型验证器', async () => {
    let sp = new Inspector();
    // 满足联合验证器中的某一个条件即可通过验证
    let res = await sp.inspect('xabcd', $Union(/abc/, Number, Boolean));
    expect(res.code).to.equal('ok');
    res = await sp.inspect(12554, $Union(/abc/, Number, Boolean));
    expect(res.code).to.equal('ok');
    res = await sp.inspect(true, $Union(/abc/, Number, Boolean));
    expect(res.code).to.equal('ok');
    res = await sp.inspect({}, $Union(/abc/, String));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·值[object Object]与正则表达式/abc/不匹配，且类型必须为字符串，当前类型为对象');
  });

  it('联合验证详细类型验证器', async () => {
    let sp = new Inspector();
    // 满足联合验证器中的某一个条件即可通过验证
    let res = await sp.inspect('xabcd', $Union(
      { label: '联合测试值', validator: /abc/ },
      { label: '联合测试值', validator: Number },
      { label: '联合测试值', validator: Boolean },
    ));
    expect(res.code).to.equal('ok');
    res = await sp.inspect(12554, $Union(
      { label: '联合测试值', validator: /abc/ },
      { label: '联合测试值', validator: Number },
      { label: '联合测试值', validator: Boolean },
    ));
    expect(res.code).to.equal('ok');
    res = await sp.inspect(true, $Union(
      { label: '联合测试值', validator: /abc/ },
      { label: '联合测试值', validator: Number },
      { label: '联合测试值', validator: Boolean },
    ));
    expect(res.code).to.equal('ok');
    res = await sp.inspect({}, $Union(
      { label: '联合测试值', validator: /abc/, error: '不匹配' },
      { label: '联合测试值', validator: String, error: (value, rule) => {
        return `${(rule as IDetailedRule).label}的值为${value}，不是字符串`;
      } },
    ));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·不匹配，且联合测试值的值为[object Object]，不是字符串');
  });
});