/* @flow */
/**
 * 虚拟DOM节点属性
 */
export default class VNode {
  // 与真实dom对象对应的属性
  tag: string | void;     // 标签的tag
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal (vue自身内部使用)
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // 标记静态节点
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder? // 是否是空节点-注释节点
  isCloned: boolean; // 是否是复制的对象
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  devtoolsMeta: ?Object; // used to store functional render context for devtools
  fnScopeId: ?string; // functional scope id support

  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag    //  当前节点是标签名 
    this.data = data    //  节点的数据信息，是一个VNodeData类型，可以参考VNodeData类型中的数据信息，比如key/class-name
    this.children = children   //  当前节点的子节点数组
    this.text = text      //  当前节点的文本
    this.elm = elm          //  当前虚拟DOM对应的真实DOM节点
    this.ns = undefined     //  当前节点的命名空间
    this.context = context     //  当前节点的Vue实例
    this.fnContext = undefined    //  当前节点的Vue实例
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key     //  当前节点的key属性，是判断dom的标识符
    this.componentOptions = componentOptions  //  当前组件的options选项
    this.componentInstance = undefined  //  当前节点对应的组件实例 
    this.parent = undefined          //  当前节点对应的父节点
    this.raw = false       // 是否是html/文本，innerHTML的时候为true，textContent的时候为false
    this.isStatic = false   // 静态节点标识
    this.isRootInsert = true  // 是否作为根节点插入
    this.isComment = false  //  // 是否是空节点-注释节点
    this.isCloned = false     // 是否是复制节点
    this.isOnce = false       // 是否是v-once 指令
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}

/**
 * 创建注释节点  (空节点)
 */
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true  // isComment是一个标志，用来标识一个节点是否是注释节点
  return node
}

/**
 * 创建文本节点
 */
export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
/**
 * 创建克隆节点
 *  模版编译时候抽出静态节点时候使用
 */
export function cloneVNode (vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
