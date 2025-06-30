export type Fetch = (query: string, values?: any[] ) => Promise<any[]>;

export type Insert = (stm: string, values: any[]) => Promise<any>;
