/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      // 如果 definition = null  本次操作为获取组件，那么就从存放组件的地方根据组件id来读取组件并返回
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        // 如果传入了definition参数，则表示本次操作为注册组件，如果是注册组件，那么在非生产环境下首先会校验组件的name值是否合法
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
            //指定name  或者id
          definition.name = definition.name || id
          // //转换组件配置对象为构造函
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        this.options[type + 's'][id] = definition

        // 注册好的组件保存在this.options['components']
        // 动态注册组件 
         //全局注册：options['components'][id] = Ctor
          //此处注册之后，就可以在全局其他地方使用
        return definition
      }
    }
  })
}
