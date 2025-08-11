import ts, { NodeArray } from "typescript";

/**
 * This is the transformer's configuration, the values are passed from the tsconfig.
 */
export interface TransformerConfig {
  verbose: boolean;
}

export const defaultConfig: TransformerConfig = {
  verbose: false,
};

/**
 * This is a utility object to pass around your dependencies.
 *
 * You can also use this object to store state, e.g prereqs.
 */
export class TransformContext {
  public factory: ts.NodeFactory;

  constructor(
    public context: ts.TransformationContext,
    public config: TransformerConfig,
  ) {
    this.factory = context.factory;
  }

  /**
   * Transforms the children of the specified node.
   */
  transform<T extends ts.Node>(node: T): T | T[] {
    console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
    return ts.visitEachChild(
      node,
      (nextnode) => visitNode(this, nextnode),
      this.context,
    );
  }

  private transformStatementList(statements: NodeArray<ts.Statement>) {
    const result: ts.Statement[] = [];

    statements.forEach((statement) => {
      const newNode = visitNode(this, statement) as ts.Statement;
      result.push(newNode);
    });

    return result;
  }

  tramsformFile(file: ts.SourceFile) {
    const newStatements = this.transformStatementList(file.statements);

    return this.factory.updateSourceFile(
      file,
      newStatements,
      file.isDeclarationFile,
      file.referencedFiles,
      file.typeReferenceDirectives,
      file.hasNoDefaultLib,
      file.libReferenceDirectives,
    );
  }
}

function visitImportDeclaration(
  context: TransformContext,
  node: ts.ImportDeclaration,
) {
  const { factory } = context;

  const path = node.moduleSpecifier;
  const clause = node.importClause;
  if (context.config.verbose) {
    console.log(path, clause);
  }
  if (!clause) return node;
  if (!ts.isStringLiteral(path)) return node;
  if (path.text !== "@rbxts/services") return node;

  const namedBindings = clause.namedBindings;
  if (!namedBindings) return node;
  if (!ts.isNamedImports(namedBindings)) return node;

  return [
    // We replace the import declaration instead of stripping it to prevent
    // issues with isolated modules.
    factory.updateImportDeclaration(
      node,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([]),
      ),
      node.moduleSpecifier,
      undefined,
    ),

    // Creates a multi-variable statement as shown below.
    //
    // const Players = game.GetService("Players"),
    //		Workspace = game.GetService("Workspace");
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        namedBindings.elements.map((specifier) => {
          const serviceName = specifier.propertyName
            ? specifier.propertyName.text
            : specifier.name.text;
          const variableName = specifier.name;

          return factory.createVariableDeclaration(
            variableName,
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("game"),
                "GetService",
              ),
              undefined,
              [factory.createStringLiteral(serviceName)],
            ),
          );
        }),
        ts.NodeFlags.Const,
      ),
    ),
  ];
}

function visitStatement(
  context: TransformContext,
  node: ts.Statement,
): ts.Statement | ts.Statement[] {
  // This is used to transform statements.
  // TypeScript allows you to return multiple statements here.

  if (ts.isImportDeclaration(node)) {
    // We have encountered an import declaration,
    // so we should transform it using a separate function.

    return visitImportDeclaration(context, node);
  }

  return context.transform(node);
}

function visitCallExpression(
  context: TransformContext,
  node: ts.CallExpression,
): ts.Node | ts.Node[] {
  const identifier = node.expression;
  if (!ts.isIdentifier(identifier)) return context.transform(node);
  if (identifier.escapedText !== "$myMacro") return context.transform(node);

  const argument = node.arguments[0];
  if (!argument) return context.transform(node); // Return the original node if no argument

  return argument;
}

function visitNode(
  context: TransformContext,
  node: ts.Node,
): ts.Node | ts.Node[] {
  console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
  if (ts.isStatement(node)) {
    return visitStatement(context, node);
  } else if (ts.isCallExpression(node)) {
    return visitCallExpression(context, node);
  }

  // We encountered a node that we don't handle above,
  // but we should keep iterating the AST in case we find something we want to transform.
  return context.transform(node);
}
