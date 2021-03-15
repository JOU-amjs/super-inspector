/*
 * @Date: 2021-03-13 11:21:20
 * @LastEditors: JOU(wx: huzhen555)
 * @LastEditTime: 2021-03-13 16:58:04
 */
import expect from 'expect.js';
import Inspector, { $Intersect } from "../src";

describe('$Intersect', () => {
  it('交叉验证简单类型验证器', async () => {
    let sp = new Inspector();
    // 满足联合验证器中的某一个条件即可通过验证
    let res = await sp.inspect('xabcd', $Intersect(/abc/, Number));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·类型必须为数字，当前类型为字符串');
    res = await sp.inspect(12554, $Intersect(/abc/, Number, Boolean));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·值12554与正则表达式/abc/不匹配');
    res = await sp.inspect('aegabceg', $Intersect(/abc/, String, Boolean));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·类型必须为布尔值，当前类型为字符串');
    res = await sp.inspect('iiiiabciiiie', $Intersect(/abc/, String));
    expect(res.code).to.equal('ok');
  });

  it('交叉验证详细类型验证器', async () => {
    let sp = new Inspector();
    // 满足联合验证器中的某一个条件即可通过验证
    let res = await sp.inspect('xabcd', $Intersect(
      { label: '联合测试值', validator: /abc/ },
      { label: '联合测试值', validator: Number },
    ));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·联合测试值类型必须为数字，当前类型为字符串');
    res = await sp.inspect(12554, $Intersect(
      { label: '联合测试值', validator: /abc/ },
      { label: '联合测试值', validator: Number },
      { label: '联合测试值', validator: Boolean },
    ));
    expect(res.code).to.equal('fail');
    expect(res.error).to.equal('·联合测试值值12554与正则表达式/abc/不匹配');
  });
});