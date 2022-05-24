/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
/**
 *  编译模板字符串的代码,e,g '<div id="app">    <h5>我是app</h5>    <input type="text" v-model="iText">    <div>输入的值：{{iText}}</div>    <div>{{formObject.name}}</div>  </div>'
 *  解析、优化、代码生成
 * 
 * 
 */
export const createCompiler = createCompilerCreator(function baseCompile(
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 1. 解析html代码字符串为ast
  const ast = parse(template.trim(), options)

  // 2.是否优化代码
  if (options.optimize !== false) {
    optimize(ast, options)
  }

  // 3. 代码生成
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
