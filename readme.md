一个拼凑的MVVM插件
===========
由 [artTemplate](https://github.com/aui/artTemplate) 与 [observe.js](https://github.com/kmdjs/observejs) 拼凑而成，功能简单，目前只兼容最新版的现代浏览器，需要兼容老设备的coder们请谨慎使用。

>**调用方法**：

> - ```new MVVM(controllerName, data)```             //  新建一个MVVM对象

>**声明控制区域：**

> ```
> <div vm-controller="controllerName">...</div>
> ```
  
>**控件类型：**

> - vm-html
> 绑定html赋值：
> ```
> <p vm-html="data"></p>
> <!-- 使用内置artTemplate模板：-->
> <div vm-html="data">
>     <script type="text/html">
>         <%= data.value%>
>     </script>
> </div>
> ```
> - vm-value
> 绑定表单赋值：
> ```
> <input vm-value="data" type="text" />
> <!--注意：表单赋值具有双向绑定，修改表单值的同时也会修改数据-->
> ```

> - vm-attr
> 绑定属性赋值：
> ```
> <div vm-attr-class="data"></div>
> ```
> - vm-css
> 绑定css属性赋值：
> ```
> <div vm-css-display="data.value ? 'none': 'block'"></div>
> ```
> - vm-on
> 绑定事件：
> ```
> <button vm-on-click="data.method()">按钮</button>
> ```

            
>**参数详解：**

> - @controllerName {String}       // 控制区域ID
> - @data{Object}       // 需要监听的数据
