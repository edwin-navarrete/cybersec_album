export type Fetch = (query: string) => Promise<any[]>;

export type Insert = (stm: string, values: any[]) => Promise<any>;
