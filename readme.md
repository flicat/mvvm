一个简单的MVVM插件
===========
内置原生语法版 [artTemplate](https://github.com/aui/artTemplate) ，功能简单，兼容IE全家。

>**MVVM对象属性：**

> - ```template {template}       // template模板对象    ```
> - ```vm  {Object}       // vm对象字典          ```
                                                                 
>**MVVM对象方法：**

> - ```var vmData = MVVM.define(controllerName, data) //  新建一个MVVM对象 ```      
    

>**@vm对象方法：**

> - ```addObserveEvent(handler)       // 添加视图更新事件   ```
> - ```removeObserveEvent(handler)      // 删除视图更新事件     ```
                                                                 
>**MVVM对象方法：**

> - ```var vmData = MVVM.define(controllerName, data) //  新建一个MVVM对象 ```      
       
       
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
>         <%= data.value %>
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

> - ```@controllerName {String}       // 控制区域ID    ```
> - ```@data{Object}       // 需要监听的对象          ```
                                                                                                        
                                                     