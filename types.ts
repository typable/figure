export type Option<T> = T | null | undefined;

export type ReactElement = unknown;
export type ReactFunction = unknown;
export type CreateElement = (element: ReactFunction, props?: Props, ...children: ReactElement[]) => ReactElement;

export type Options = { createElement: CreateElement };
export type Refs = Record<string, unknown>;
export type Props = Record<string, unknown>;
export type Slices = TemplateStringsArray;
export type Values = unknown[];
