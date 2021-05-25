import { parseScript, traverse, generate, Program, Node, chalk, log } from '@common/index'

/**
 * 使用 esprima 库的 parseScript 方法
 * 把 originCode 转换成 AST（抽象代码树 Abstract Ayntax Tree）
 * 然后在 enter 钩子里修改 funciton 名
 */
const transformFnName = () => {
  const originCode = `function getUser() {}`
  const AST: Program = parseScript(originCode)

  log(chalk.green.bold('Ast =>'), AST)
  log(chalk.green.bold('Old =>'), chalk.yellow(generate(AST)))

  traverse(AST, {
    enter(node: Node): void {
      log(chalk.red(`enter => node.type: ${node.type}`))

      // 修改 Identifier，也就是 方法名
      if (node.type === 'Identifier') node.name = 'getBroker'
    },
    leave(node: Node): void {
      log(chalk.blue(`leave => node.type: ${node.type}`))
    },
  })

  log(chalk.green.bold('New =>'), chalk.yellow(generate(AST)))
}

export default transformFnName