import ts from "typescript";
import {
  defaultConfig,
  TransformContext,
  TransformerConfig,
} from "./transformer";

export default function (
  program: ts.Program,
  config?: Partial<TransformerConfig>
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const cont = new TransformContext(context, { ...defaultConfig, ...config });
    return (file: ts.SourceFile) => {
      console.log("file");
      const visitor = (node: ts.Node) => {
        console.log(node.kind, `\t# ts.SyntaxKind.${ts.SyntaxKind[node.kind]}`);
        return ts.visitEachChild(node, visitor, context);
      };
      return ts.visitNode(file, visitor) as ts.SourceFile;
    };
  };
}
