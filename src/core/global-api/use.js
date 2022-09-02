/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  /**
   * use 插件
   */
  Vue.use = function (plugin: Function | Object) {
    // 1. 如果插件已经存在，那么就不新增，避免重新新增
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // 2. 获取插件的参数
    const args = toArray(arguments, 1)
    args.unshift(this)
    // 3. 找到install方法执行插件
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    // 4.增加插件到插件数组中
    installedPlugins.push(plugin)
    return this
  }
}
