import {
  isArrayExpression,
  arrayExpression,
  identifier,
  memberExpression,
  callExpression,
  variableDeclarator,
  variableDeclaration,
} from '@babel/types'
import { transform } from '@babel/core'
import { default as chalk } from 'chalk'

import type { VariableDeclaration, SpreadElement } from '@babel/types'
import type { PluginItem, BabelFileResult, NodePath } from '@babel/core'

const transformArraySpreadPlugin = (): PluginItem => {
  return {
    visitor: {
      VariableDeclaration(path: NodePath<VariableDeclaration>) {
        const { node } = path //         节点: const arr = [ ...arr1, ...arr2 ];
        const { declarations } = node // declarations: arr = [ ...arr1, ...arr2 ];
        const kind = 'var'

        // 边界判定
        if (node.kind !== kind && declarations.length === 1 && isArrayExpression(declarations[0].init)) {
          const args: SpreadElement[] = declarations[0].init.elements.map(item => {
            const { argument }: any = item
            return argument
          })
          // [].concat()
          const callee = memberExpression(arrayExpression(), identifier('concat'))
          // [].concat(arr1, arr2)
          const init = callExpression(callee, args)
          // arr = [].concat(arr1, arr2)
          const declaration = variableDeclarator(declarations[0].id, init)
          // var arr = [].concat(arr1, arr2)
          const newVariableDeclaration = variableDeclaration(kind, [declaration])
          path.replaceWith(newVariableDeclaration)
        }
      },
    },
  }
}

/**
 * Spread the Array
 * @param code const arr = [ ...arr1, ...arr2 ];
 * @returns var arr = [].concat(arr1, arr2)
 */
const transformArraySpread = (code = `const arr = [ ...arr1, ...arr2 ];`): string | null | undefined => {
  console.log(chalk.green.bold('old =>'))
  console.log(code)

  const data: BabelFileResult | null = transform(code, {
    plugins: [transformArraySpreadPlugin()],
  })

  // 转换后
  // var arr = [].concat(arr1, arr2)
  console.log(chalk.red.bold('New =>'))
  console.log(data?.code)

  return data?.code
}

export default transformArraySpread
export { transformArraySpreadPlugin }
