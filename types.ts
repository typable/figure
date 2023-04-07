export type ReactElement = unknown;
export type ReactFunction = (props: unknown) => ReactElement;
export type CreateFunction = (element: ReactFunction | string, props?: Props, ...children: ReactElement[]) => ReactElement;
export type HtmlFunction = (slices: Slices, ...values: Values) => ReactElement[];
export type Figure = { dict: (dict?: Dict) => HtmlFunction, dyn: CreateFunction };
export type Refs = Record<string, unknown>;
export type Props = Record<string, unknown>;
export type Slices = TemplateStringsArray;
export type Values = unknown[];

export interface Dict {
  [key: string]: ReactFunction | Dict;
}
