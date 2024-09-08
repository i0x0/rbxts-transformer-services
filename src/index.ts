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
      return cont.tramsformFile(file);
    };
  };
}
