export type ReactElement = unknown;
export type ReactFunction = (props: unknown) => ReactElement;
export type CreateElement = (element: ReactFunction | string, props?: Props, ...children: ReactElement[]) => ReactElement;

export type Options = { createElement: CreateElement };
export type Refs = Record<string, unknown>;
export type Props = Record<string, unknown>;
export type Slices = TemplateStringsArray;
export type Values = unknown[];

export interface Dict {
  [key: string]: ReactFunction | Dict;
}
