import { transform } from '@babel/core'
import { isObjectPattern, identifier, memberExpression, variableDeclarator, variableDeclaration } from '@babel/types'
import { default as chalk } from 'chalk'

import type {
  VariableDeclaration,
  ObjectExpression,
  ObjectPattern,
  ObjectProperty,
  Identifier,
  VariableDeclarator,
} from '@babel/types'
import type { PluginItem, BabelFileResult, NodePath } from '@babel/core'

const transformObjectSpreadPlugin = (): PluginItem => {
  return {
    visitor: {
      VariableDeclaration(path: NodePath<VariableDeclaration>) {
        // 节点: const { sex, age, empty, cute } = { sex: 'male', age: 12, cute: 'yes' };
        const { node } = path
        // declarations:{ sex, age, empty, cute } = { sex: 'male', age: 12, cute: 'yes' };
        const { declarations } = node

        for (const declaration of declarations) {
          // 边界判定
          if (isObjectPattern(declaration.id)) {
            // { sex, age, empty, cute }
            const leftObjects: ObjectPattern = declaration.id
            // [ 'sex', 'age', 'empty', 'cute' ]
            const leftKeys = leftObjects.properties.map((property: any) => {
              const key: Identifier = property.key
              return key.name
            })
            const init: ObjectExpression | any = declaration.init
            // { sex: 'male', age: 12, cute: 'yes' };
            const rightObjects: ObjectProperty[] = init.properties
            // [ 'sex', 'age', 'cute' ]
            const rightKeys = rightObjects.map((property: any) => {
              const key: Identifier = property.key
              return key.name
            })

            // _sex$age$cute
            const cornerstone: Identifier = identifier(
              leftKeys.reduce((acc, key, i) => {
                if (rightKeys.includes(key)) acc += key + (i <= rightKeys.length - 1 ? '$' : '')
                return acc
              }, '_')
            )

            const arr: VariableDeclarator[] = []

            /**
             * _sex$age$cute = {
             *   sex: 'male',
             *   age: 12,
             *   cute: 'yes'
             * }
             */
            arr.push(variableDeclarator(cornerstone, init))

            /**
             * sex = _sex$age$cute.sex,
             * age = _sex$age$cute.age,
             * empty = _sex$age$cute.empty,
             * cute = _sex$age$cute.cute;
             */
            leftKeys.forEach(key => {
              // sex
              const iden = identifier(key)
              // sex = _sex$age$cute.sex,
              arr.push(variableDeclarator(iden, memberExpression(cornerstone, iden)))
            })

            path.replaceWith(variableDeclaration('var', arr))
          }
        }
      },
    },
  }
}

/**
 * Spread the Object
 * @param code const { sex, age, empty, cute } = { sex: 'male', age: 12, cute: 'yes' };
 * @returns
 * var _sex$age$cute = {
 *     sex: "male",
 *     age: 12,
 *     cute: "yes"
 *   },
 *   sex = _sex$age$cute.sex,
 *   age = _sex$age$cute.age,
 *   empty = _sex$age$cute.empty,
 *   cute = _sex$age$cute.cute;
 */
const transformObjectSpread = (
  code = `const { sex, age, empty, cute } = { sex: 'male', age: 12, cute: 'yes' };`
): string | null | undefined => {
  console.time()
  console.log(chalk.green.bold('old =>'))
  console.log(code)

  const data: BabelFileResult | null = transform(code, {
    plugins: [transformObjectSpreadPlugin()],
  })

  /**
   * 转换后
   * var _sex$age$cute = {
   *     sex: "male",
   *     age: 12,
   *     cute: "yes"
   *   },
   *   sex = _sex$age$cute.sex,
   *   age = _sex$age$cute.age,
   *   empty = _sex$age$cute.empty,
   *   cute = _sex$age$cute.cute;
   */
  console.log(chalk.red.bold('New =>'))
  console.log(data?.code)
  console.timeEnd()

  return data?.code
}

export default transformObjectSpread
export { transformObjectSpreadPlugin }
