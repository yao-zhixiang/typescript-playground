import { isImportSpecifier, stringLiteral, importDefaultSpecifier, importDeclaration } from '@babel/types'
import { transform } from '@babel/core'
import { default as chalk } from 'chalk'

import type { PluginItem, BabelFileResult, NodePath } from '@babel/core'
import type { ImportDeclaration } from '@babel/types'

interface TransformImportPathPluginOptions {
  libraryName?: string
  libraryDirectory: string
}

const transformImportPlugin = (opt: TransformImportPathPluginOptions): PluginItem => {
  const { libraryName, libraryDirectory } = opt

  return {
    visitor: {
      ImportDeclaration(path: NodePath<ImportDeclaration>) {
        const { node } = path //      节点: import { Button, Icon } from 'vant'
        const { specifiers, source } = node

        // import 有 2 种，一种是 specifier 一种是 default specifier
        // 这里要排除掉 library 名不匹配，且非唯一 default import 导入（这里利用 default 只能在头部的特性，判断尾部就可以了）
        if (source.value === libraryName && isImportSpecifier(specifiers[specifiers.length - 1])) {
          const result = specifiers.map(specifier => {
            let newSource = undefined
            if (isImportSpecifier(specifier)) {
              newSource = stringLiteral(`${source.value}/${libraryDirectory}/${specifier.local.name}`)
            } else {
              newSource = stringLiteral(source.value)
            }

            return importDeclaration([importDefaultSpecifier(specifier.local)], newSource)
          })

          if (result.length > 1) path.replaceWithMultiple(result)
          else path.replaceWith(result[0])
        }
      },
    },
  }
}

const transformImport = (
  code = `
import { Button } from 'vant';
import { Icon, View } from 'vant';
import vant, { List } from 'vant';
import Vue from 'vue';
import _Vue from 'vue';
import { post } from 'axios';`.trimStart()
): string | null | undefined => {
  console.log(chalk.green('old => '))
  console.log(code)

  const data: BabelFileResult | null = transform(code, {
    plugins: [
      transformImportPlugin({ libraryName: 'vant', libraryDirectory: 'lib' }),
      transformImportPlugin({ libraryName: 'axios', libraryDirectory: 'lib' }),
    ],
  })

  // 转换后
  // import { Button } from 'vant/lib/Button';
  // import { Icon } from 'vant/lib/Icon';
  // import vant from 'vant';
  console.log(chalk.red('new => '))
  console.log(data?.code)

  return data?.code
}

export default transformImport
export { transformImportPlugin }

export { TransformImportPathPluginOptions }
