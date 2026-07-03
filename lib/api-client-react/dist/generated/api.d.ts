import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { BlastJobId, BlastPollResponse, BlastResultsParams, BlastSubmitRequest, ErrorResponse, HealthStatus, Virus } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListVirusesUrl: () => string;
/**
 * @summary List all viruses in the database
 */
export declare const listViruses: (options?: RequestInit) => Promise<Virus[]>;
export declare const getListVirusesQueryKey: () => readonly ["/api/viruses"];
export declare const getListVirusesQueryOptions: <TData = Awaited<ReturnType<typeof listViruses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listViruses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listViruses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListVirusesQueryResult = NonNullable<Awaited<ReturnType<typeof listViruses>>>;
export type ListVirusesQueryError = ErrorType<unknown>;
/**
 * @summary List all viruses in the database
 */
export declare function useListViruses<TData = Awaited<ReturnType<typeof listViruses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listViruses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getBlastSubmitUrl: () => string;
/**
 * @summary Submit a nucleotide sequence to NCBI BLAST
 */
export declare const blastSubmit: (blastSubmitRequest: BlastSubmitRequest, options?: RequestInit) => Promise<BlastJobId>;
export declare const getBlastSubmitMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof blastSubmit>>, TError, {
        data: BodyType<BlastSubmitRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof blastSubmit>>, TError, {
    data: BodyType<BlastSubmitRequest>;
}, TContext>;
export type BlastSubmitMutationResult = NonNullable<Awaited<ReturnType<typeof blastSubmit>>>;
export type BlastSubmitMutationBody = BodyType<BlastSubmitRequest>;
export type BlastSubmitMutationError = ErrorType<ErrorResponse>;
/**
* @summary Submit a nucleotide sequence to NCBI BLAST
*/
export declare const useBlastSubmit: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof blastSubmit>>, TError, {
        data: BodyType<BlastSubmitRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof blastSubmit>>, TError, {
    data: BodyType<BlastSubmitRequest>;
}, TContext>;
export declare const getBlastResultsUrl: (params: BlastResultsParams) => string;
/**
 * @summary Poll NCBI BLAST results for a given RID
 */
export declare const blastResults: (params: BlastResultsParams, options?: RequestInit) => Promise<BlastPollResponse>;
export declare const getBlastResultsQueryKey: (params?: BlastResultsParams) => readonly ["/api/blast/results", ...BlastResultsParams[]];
export declare const getBlastResultsQueryOptions: <TData = Awaited<ReturnType<typeof blastResults>>, TError = ErrorType<ErrorResponse>>(params: BlastResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof blastResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof blastResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type BlastResultsQueryResult = NonNullable<Awaited<ReturnType<typeof blastResults>>>;
export type BlastResultsQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Poll NCBI BLAST results for a given RID
 */
export declare function useBlastResults<TData = Awaited<ReturnType<typeof blastResults>>, TError = ErrorType<ErrorResponse>>(params: BlastResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof blastResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map