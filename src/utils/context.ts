import { AsyncLocalStorage } from 'async_hooks';

export interface ContextData {
    traceId?: string;
}

const context = new AsyncLocalStorage<ContextData>();

export const getContext = () => context.getStore();

export const runWithContext = <T>(data: ContextData, fn: () => T): T => {
    return context.run(data, fn);
};

export const getTraceId = (): string | undefined => {
    return context.getStore()?.traceId;
};
