# [Super Inspector](https://github.com/JOU-amjs/super-inspector)
[![npm](https://img.shields.io/npm/v/super-inspector)](https://www.npmjs.com/package/super-inspector)
![size](https://img.shields.io/bundlephobia/min/super-inspector)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
[![Coverage Status](https://coveralls.io/repos/github/JOU-amjs/super-inspector/badge.svg)](https://coveralls.io/github/JOU-amjs/super-inspector)
![jslib](https://img.shields.io/badge/Powered%20by-jslib%20base-brightgreen.svg)

🔎🔎🔎 一个为开发动态和复杂表单而生的验证库，还为了你优雅的代码

## **特性**
1. 支持动态联合验证，通过声明依赖关系决定需要验证的值
2. 支持定义通用错误类型
3. 支持多层级嵌套验证器
4. 支持异步验证
5. 支持TypeScript

## **安装**
```bash
$ npm install --save super-inspector
```
---
## **使用**
### *导入*
commonjs(Node.js)
```js
var SuperInspector = require('super-inspector').default;
```

ES6 Module
```js
import SuperInspector from 'super-inspector';
```
浏览器
```html
<script src="https://unpkg.com/super-inspector/dist/super-inspector.umd.js"></script>
```

### *创建对象*
```javascript
let sp = new SuperInspector(config => {
  // throwError为true时，验证失败将会抛出错误
  // throwError为false时，调用验证函数将返回验证结果(成功或失败)
  // 默认为false
  config.throwError = false;

  // 可自定义任意名称的通用错误集合
  // 具体使用见api介绍
  config.errors.falsy = (value, rule, key, extra, depValue) => {
    return key + ' is required but got empty';
  }

  // 当验证规则中required: true时，falsyValues数组中的值将被作为判断是否为空的参考值
  // 默认为[undefined, null]
  config.falsyValues.push('');

  // 如果验证失败，抛出或返回错误前将调用transformError钩子函数转换数据
  config.transformError = errors => {
    return errors.map(({ key, error }) => `[${key}]${error}`).join('\n');
  }
});
```

### *验证单个值*
```javascript
// 调用inspect将返回Promise对象
// 验证通过时，result的值为{code: 'ok', error: ''}
// 验证失败时，result的值为{code: 'fail', error: '错误信息'}
let result = await sp.inspect(1314520, Number);
```
### *批量验证多个值*
```javascript
// 调用batchInspect将返回Promise对象
let result = await sp.batchInspect({
  username: 'John123',
  password: 'qwertyu12',
}, {
  username: String,
  password: /^.{8,20}$/,
});
```

### *动态联合验证*
```javascript
// 以登录举例，当loginType的值为username时，username、password才会进行验证
// 当loginType的值为mobile时，mobileNumber和captcha才会进行验证
// 具体验证规则可查看api介绍
let result = sp.batchInspect({
  loginType: 'username',
  username: 'John123',
  password: 'qwertyu12',

  mobileNumber: '',
  captcha: '',
}, {
  loginType: /^(username|mobile)$/,
  username: {
    // required默认为true，因此这边也可以省略
    required: true,
    validator: String,
    deps: {
      // 表示当loginType的值符合次正则表达式时，username值才会进行验证
      // 也可以设置多个依赖项，只要其中一项验证通过，该值会进行验证
      loginType: /^username$/
    },
  },
  password: {
    validator: /^.{8,20}$/,
    deps: {
      loginType: /^username$/
    }
  },
  mobileNumber: {
    validator: /^.{8,20}$/,
    deps: {
      loginType: /^mobile$/
    }
  },
  captcha: {
    validator: /[0-9]{6}/,
    deps: {
      loginType: /^mobile$/
    }
  },
});
```
### *自定义验证器*
同步
```javascript
// 自定义函数参数分别为：验证值、验证规则、验证key(调用只有batchInspect时才有值)、依赖项的值(验证规则声明了依赖项时才有值)
// 通过new Error抛出错误不会被验证库捕获，因此只能通过this.throw抛出抛出错误表示验证失败
// 不抛出错误表示验证通过
let result = await sp.inspect(
  '[1,2,3].join(",")',
  function(value, rule, key, depValue) {
    if (!value) {
      // 抛出自定义内容的错误(表示验证失败)
      this.throw(key + '的值不能为空');
    }
    else if (/<[a-zA-Z]{1,10}>/.test(value)) {
      // 抛出一个通用异常(创建对象时配置)表示验证失败
      this.throw.containHtmls();
    }
  }
);
```
异步
```javascript
// 声明异步函数，也可以声明一个返回promise对象的普通函数
let result = await sp.inspect(
  'john@gmail.com',
  async function(value, rule, key, depValue) {
    let validRes = await fetch('https://host?email=' + value)
    .then(response => response.json());
    if (validRes.code !== 200) {
      this.throw('邮箱地址已被占用');
    }
  }
);
```
### *内置的验证器*
数组验证器(验证数组项)
```javascript
import { $Array } from 'super-inspector';
// 验证数组每项的值是否为图片(数组简单项)
let result1 = sp.inspect([
  'https://img1.png',
  'https://img2.jpg'
], $Array(/(png|jpg|jpeg|webp)$/));

// 验证批量添加的人员信息(数组复杂项)
let result2 = sp.inspect([
  { avatar: '', name: 'Ann', age: 24 },
  { avatar: 'https://avatar1.png', name: 'Tom', age: 26 },
], $Array({
  avatar: { required: false, validator: /^(png|jpg|jpeg|webp)$/ },
  name: String,
  age: Number
}));
```
对象验证器(验证对象值)
```javascript
import { $Object } from 'super-inspector';
// 验证每个人的头像是否为图片(对象简单值)
let result1 = sp.inspect({
  avatar_Ann: 'https://img1.png',
  avatar_Tom: 'https://img2.jpg'
}, $Object(/(png|jpg|jpeg|bmp|webp)$/));

// 验证每个人的位置是否正确(对象复杂值)
let reuslt2 = sp.inspect({
  coordinate_Ann: { lat: 24.443729, lng: 118.128319 },
  coordinate_Ann: { lat: 32.827119, lng: 120.293013 },
}, $Object({
  lat: Number,
  lng: Number
}));
```

联合验证器(等价于"或")
```javascript
import { $Union } from 'super-inspector';
// 满足$Union中其中一个验证规则可通过
let result1 = sp.inspect(
  'https://img1.png',
  $Union(/png$/, /jpg$/, /jpeg$/, /webp$/)
);

// 与$Array嵌套使用
let res = sp.inspect([
  'https://img1.png',
  'https://img2.jpg'
], $Array(
  $Union(/png$/, /jpg$/, /jpeg$/, /webp$/)
));
```

交叉验证器(等价于"与")
```javascript
import { $Intersect } from 'super-inspector';
// 满足$Intersect中所有验证规则才可通过
let res = sp.inspect('javascript', $Intersect(String, function(value) {
  if (value.length < 8) {
    this.throw('必须填写至少8个字符');
  }
}));
```
### *错误类型*
针对错误信息的需求，super-inspector提供了3种错误类型
1. 多个表单项需要返回相同的错误信息时，在创建对象时定义若干个通用错误类型
```javascript
// 创建验证对象
let sp = new SuperInspector(config => {
  // 固定错误使用字符串
  config.errors.containHtmls = '不能包含html标签';
  // 动态错误使用函数，函数必须返回字符串
  // extra为调用错误抛出函数时传入的额外数据
  config.errors.exceedLength10 = (value, rule, key, extra, depValue) => {
    return (rule.label || key) + '的长度不能超过10' + '(当前长度为' + value.length + ')';
  }
});

// 在自定义验证器中抛出通用错误
function customValidator(value) {
  if (value.length > 10) {
    this.throw.exceedLength10();
  }
}
```
2. 自定义验证器中抛出任意的错误信息
```javascript
function customerValidator() {
  this.throw('自定义的错误信息');
}
```
3. 特定表单项需要返回特定的错误信息时，可在验证规则中指定替换的错误信息
```javascript
// 当自定义验证器中抛出错误时，result内的信息会被替换为error字段中的信息
let result = await sp.inspect(
  '[1,2,3].join(",")',
  {
    error: '文本信息不能为空，且不能包含html标签信息',
    validator: function(value, rule, key, depValue) {
      if (!value) {
        // 抛出自定义内容的错误(表示验证失败)
        this.throw(key + '的值不能为空');
      }
      else if (/<[a-zA-Z]{1,10}>/.test(value)) {
        // 抛出一个通用异常(创建对象时配置)表示验证失败
        this.throw.containHtmls();
      }
    }
  }
);
```

### *导出参与验证的项*
在动态表单中，我们通常需要将不参与验证的表单项隐藏，`affectedItems`函数将会告诉我们哪些表单项需要参与验证，哪些不需要
```javascript
// result的值为{ loginType: true, username: true, password: true, mobileNumber: false, captcha: false }
// 我们可根据此数据隐藏值为false的表单项
let result = sp.affectedItems({
  loginType: 'username',
  username: 'John123',
  password: 'qwertyu12',

  mobileNumber: '',
  captcha: '',
}, {
  loginType: /^(username|mobile)$/,
  username: {
    // required默认为true，因此这边也可以省略
    required: true,
    validator: String,
    deps: {
      // 表示当loginType的值符合次正则表达式时，username值才会进行验证
      // 也可以设置多个依赖项，只要其中一项验证通过，该值会进行验证
      loginType: /^username$/
    },
  },
  password: {
    validator: /^.{8,20}$/,
    deps: {
      loginType: /^username$/
    }
  },
  mobileNumber: {
    validator: /^.{8,20}$/,
    deps: {
      loginType: /^mobile$/
    }
  },
  captcha: {
    validator: /[0-9]{6}/,
    deps: {
      loginType: /^mobile$/
    }
  },
});
```

## **例子**
> 可下载直接在浏览器运行

Vue -> [vue.example.html](https://github.com/JOU-amjs/super-inspector/blob/master/example/vue.html)

React -> [react.example.html](https://github.com/JOU-amjs/super-inspector/blob/master/example/react.html)

## **APIs**
- sp.inspect
- sp.batchInspect
- sp.affectedItems
- $Array
- $Object
- $Union
- $Intersect


## **后项**
- [提交一个issue](https://github.com/JOU-amjs/super-inspector/issues)