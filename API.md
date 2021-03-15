# [Super Inspector](https://github.com/JOU-amjs/super-inspector) APIs

## **实例配置**
### *config.errors*
- 描述: 设置通用的错误信息，可在任意任意的验证器抛出这些信息。
- 类型1: string(固定错误信息)
- 类型2: function(value: any, rule: baseTypeConstructor|RegExp|object|function, key?: string, depValue?: any): string (动态错误信息)
- 默认值: errors对象默认包含以下7个通用信息，开发者可覆盖
  1. falsy: 验证器声明了`required:true`，但验证值为空时抛出
  2. regexp: 验证器为RegExp对象时，验证失败抛出此错误
  3. type: 验证器为数据类型构造器如`String`、`Number`等，验证失败抛出此错误
  4. notArray: 验证器$Array遇到非数组时抛出
  5. arrayError: 验证器$Array在数组项验证失败时抛出
  6. notObject: 验证器$Object遇到非对象时抛出
  7. objectError: 验证器$Object在对象属性值验证失败时抛出
- 示例:
```javascript
let sp = new SuperInspector(config => {
  config.errors.containHtmls = '不能包含html标签';
  config.errors.exceedLength10 = (value, rule, key, extra, depValue) => {
    return (rule.label || key) + '的长度不能超过10' + '(当前长度为' + value.length + ')';
  }
});
```

### *config.throwError*
- 描述: 验证数据失败时是否抛出错误
- 类型: boolean
- 默认值: false

### *config.falsyValues*
- 描述: 当验证规则中`required:true`时，falsyValues数组中的值将被作为判断是否为空的参考值
- 类型: array
- 默认值: [undefined, null]

### *config.transformError*
- 描述: 验证失败时的错误转换钩子函数，将在返回或抛出错误前被调用
- 参数:
  - {{key: string, error: string}[]} errors: 错误信息数组
- 返回值: any
- 示例:
```javascript
let sp = new SuperInspector(config => {
  config.transformError = errors => {
    return errors.map(item => `[${item.key}]${item.error}`).join('\n');
  }
});
```


## **实例方法**
### *inspector.inspect*
- 描述: 验证单个数据
- 参数:
  - {any} value: 被验证数据
  - {baseTypeConstructor | RegExp | object | function} rule: 验证规则
- 返回值: 返回Promise实例，`throwError=false`时包含验证结果，否则不包含任何值
- 示例:
```javascript
let result = await sp.inspect(1314520, Number);
```

### *inspector.batchInspect*
- 描述: 批量验证数据
- 参数:
  - {object} value: 被验证数据的集合对象
  - {object} rule: 验证规则集合对象
- 返回值: 返回Promise实例，`throwError=false`时包含验证结果，否则不包含任何值
- 示例:
```javascript
let result = await sp.batchInspect({
  username: 'John123',
  password: 'qwertyu12',
}, {
  username: String,
  password: /^.{8,20}$/,
});
```

### *inspector.affectedItems*
- 描述: 导出数据对象中每个数据项是否受影响，即是否参与验证
- 参数:
  - {object} value: 被验证数据的集合对象
  - {object} rule: 验证规则集合对象
- 返回值: {Promise<{[key: string]: boolean}>} 对象中的boolean值表示是否受影响
- 示例:
```javascript
let result = await sp.affectedItems({
  loginType: 'username',
  username: 'John123',
  password: 'qwertyu12',

  mobileNumber: '',
  captcha: '',
}, {
  loginType: /^(username|mobile)$/,
  username: {
    required: true,
    validator: String,
    deps: {
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

## **内置验证器**
### *$Array*
- 描述: 数组验证器，验证数组项，可与其他验证器层叠使用
- 参数:
  - validator: {baseTypeConstructor | RegExp | function} 验证器
- 返回值: {function} 新的验证器函数
- 示例
```javascript
let result1 = await sp.inspect([
  'https://img1.png',
  'https://img2.jpg'
], $Array(/(png|jpg|jpeg|webp)$/));
```

### *$Object*
- 描述: 对象验证器，验证对象值，可与其他验证器层叠使用
- 参数:
  - validator: {baseTypeConstructor | RegExp | function} 验证器
- 返回值: {function} 新的验证器函数
- 示例
```javascript
let result1 = await sp.inspect({
  avatar_Ann: 'https://img1.png',
  avatar_Tom: 'https://img2.jpg'
}, $Object(/(png|jpg|jpeg|bmp|webp)$/));
```

### *$Union*
- 描述: 联合验证器，等价于"或"，即其中一个验证器验证通过即可
- 参数:
  - [...validators] 不定个数验证器
- 返回值: {function} 新的验证器函数
- 示例
```javascript
let result1 = await sp.inspect(
  'https://img1.png',
  $Union(/png$/, /jpg$/, /jpeg$/, /webp$/)
);
```

### *$Intersect*
- 描述: 交叉验证器，等价于"与"，即所有验证器通过即可
- 参数:
  - [...validators] 不定个数验证器
- 返回值: {function} 新的验证器函数
- 示例
```javascript
let res = await sp.inspect('javascript', $Intersect(String, /^java/i));
```