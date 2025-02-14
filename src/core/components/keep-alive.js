/* @flow */

import { isRegExp, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

type CacheEntry = {
  name: ?string;
  tag: ?string;
  componentInstance: Component;
};

type CacheEntryMap = { [key: string]: ?CacheEntry };

function getComponentName (opts: ?VNodeComponentOptions): ?string {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

/**
 * 遍历清楚缓存cache
 */
function pruneCache (keepAliveInstance: any, filter: Function) {
  const { cache, keys, _vnode } = keepAliveInstance
  for (const key in cache) {
    const entry: ?CacheEntry = cache[key]
    if (entry) {
      const name: ?string = entry.name
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}
/**
 * 移除单个组件
 */
function pruneCacheEntry (
  cache: CacheEntryMap,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const entry: ?CacheEntry = cache[key]
  // 每个组件实例销毁
  if (entry && (!current || entry.tag !== current.tag)) {
    entry.componentInstance.$destroy()
  }
  // 清除缓存的key
  cache[key] = null
  remove(keys, key)
}

const patternTypes: Array<Function> = [String, RegExp, Array]

export default {
  name: 'keep-alive',
  abstract: true,   // 定义为抽象组件，不渲染为真实dom

  props: {
    include: patternTypes,   // 缓存的白名单
    exclude: patternTypes,  //  缓存的黑名单
    max: [String, Number]    // 缓存组件实例数量的最大值，用户LRU(缓存淘汰算法的最大值)
  },

  methods: {
    // 缓存组件
    cacheVNode() {
      const { cache, keys, vnodeToCache, keyToCache } = this
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache
        cache[keyToCache] = {
          name: getComponentName(componentOptions),
          tag,
          componentInstance,
        }
        keys.push(keyToCache)
        // 如果缓存的值大于设置的最大值就移除最数组第一个
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
        this.vnodeToCache = null
      }
    }
  },

  created () {
    // 创建一个无原型链的缓存对象 - 缓存虚拟dom
    this.cache = Object.create(null)
    this.keys = []  // 缓存虚拟dom的key值集合
  },

  destroyed () {
    // 删除所有的缓存虚拟dom
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    this.cacheVNode()
    // 实时监听白名单的变动
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    // 实时监听黑名单的变动
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  updated () {
    this.cacheVNode()
  },

  render () {
    const slot = this.$slots.default
    // 第一步：获取keep-alive包裹着的第一个子组件对象及其组件名；
    const vnode: VNode = getFirstComponentChild(slot) //找个第一个子组件的Vnode节点
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // 第二步：根据设定的黑白名单（如果有）进行条件匹配，决定是否缓存。不匹配，直接返回组件实例（VNode），否则执行第三步
      // check pattern  匹配组件名称name
      const name: ?string = getComponentName(componentOptions)
      const { include, exclude } = this
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      // 第三步：根据组件ID和tag生成缓存Key，并在缓存对象中查找是否已缓存过该组件实例。如果存在，直接取出缓存值并更新该key在this.keys中的位置（更新key的位置是实现LRU置换策略的关键），否则执行第四步
      //定义组件的key
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      // 第四步：在this.cache对象中存储该组件实例并保存key值，之后检查缓存的实例数量是否超过max的设置值，超过则根据LRU置换策略删除最近最久未使用的实例（即是下标为0的那个key）  
      // 如果缓存存在从缓存中获取组件实例
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // 删除之前的key, 重新再新增key - 调整key的顺序
        remove(keys, key)
        keys.push(key)
      } else {
        // delay setting the cache until update  延迟设置组件缓存
        this.vnodeToCache = vnode
        this.keyToCache = key
      }
      // 第五步：最后并且很重要，将该组件实例的keepAlive属性值设置为true 在渲染阶段以及hooks函数中使用
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
