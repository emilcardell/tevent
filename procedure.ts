import type { ProcedureCallOptions } from './procedureBuilder';

export const procedureTypes = ['query', 'mutation', 'subscription'] as const;
/**
 * @public
 */
export type ProcedureType = (typeof procedureTypes)[number];

type ClientContext = Record<string, unknown>;

/**
 * @internal
 */
export interface ProcedureOptions {
  /**
   * Client-side context
   */
  context?: ClientContext;
  signal?: AbortSignal;
}

interface BuiltProcedureDef {
  input: unknown;
}
/**
 *
 * @internal
 */
export interface Procedure<
  TType extends ProcedureType,
  TDef extends BuiltProcedureDef,
> {
  _def: {
    _input_in: TDef['input'];
    procedure: true;
    type: TType;
    /**
     * @internal
     * Meta is not inferrable on individual procedures, only on the router
     */
    meta: unknown;
  };
  /**
   * @internal
   */
  (opts: ProcedureCallOptions): Promise<unknown>;
}

export interface QueryProcedure<TDef extends BuiltProcedureDef>
  extends Procedure<'query', TDef> {}

export interface MutationProcedure<TDef extends BuiltProcedureDef>
  extends Procedure<'mutation', TDef> {}

export interface SubscriptionProcedure<TDef extends BuiltProcedureDef>
  extends Procedure<'subscription', TDef> {}

export type AnyQueryProcedure = QueryProcedure<any>;
export type AnyMutationProcedure = MutationProcedure<any>;
export type AnySubscriptionProcedure = SubscriptionProcedure<any>;
export type AnyProcedure = Procedure<ProcedureType, any>;

export type inferProcedureInput<TProcedure extends AnyProcedure> =
  undefined extends inferProcedureParams<TProcedure>['_input_in']
    ? void | inferProcedureParams<TProcedure>['_input_in']
    : inferProcedureParams<TProcedure>['_input_in'];

export type inferProcedureParams<TProcedure> = TProcedure extends AnyProcedure
  ? TProcedure['_def']
  : never;

