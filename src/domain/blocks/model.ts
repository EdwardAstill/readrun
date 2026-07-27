import type { SourcePosition } from "../validation/model.ts";

export type BlockName = string;

export interface TextRun {
  type?: "text";
  text: string;
  position?: SourcePosition;
}

export interface BlockAttr {
  name: string;
  value: string | true;
  raw: string;
  position?: SourcePosition;
}

export interface BlockSourceRef {
  relPath?: string;
  startLine: number;
  endLine: number;
}

export type BlockNode = Block | TextRun;

export interface Block {
  type: "block";
  name: BlockName;
  attrs: BlockAttr[];
  body: string;
  src?: string | null;
  children?: BlockNode[];
  source: BlockSourceRef;
}
