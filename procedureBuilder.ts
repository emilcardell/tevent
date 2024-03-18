import { Parser, inferParser } from "./parser";
import { ProcedureType, QueryProcedure } from "./procedure";
import {
  GetRawInputFn,
  MaybePromise,
  Simplify,
  TypeError,
} from "./types";

export const unsetMarker = Symbol("unsetMarker");
type UnsetMarker = typeof unsetMarker;
type DefaultValue<TValue, TFallback> = TValue extends UnsetMarker
  ? TFallback
  : TValue;

type IntersectIfDefined<TType, TWith> = TType extends UnsetMarker
  ? TWith
  : TWith extends UnsetMarker
  ? TType
  : Simplify<TType & TWith>;

/**
 * @internal
 */
export interface ProcedureCallOptions {
  ctx: unknown;
  getRawInput: GetRawInputFn;
  input?: unknown;
  path: string;
  type: ProcedureType;
}

/**
 * Procedure resolver options (what the `.query()`, `.mutation()`, and `.subscription()` functions receive)
 * @internal
 */
export interface ProcedureResolverOptions<TContext, _TMeta, TInputOut> {
  ctx: Simplify<TContext>;
  input: TInputOut extends UnsetMarker ? undefined : TInputOut;
}

/**
 * A procedure resolver
 */
type ProcedureResolver<TContext, TMeta, TInputOut, $Output> = (
  opts: ProcedureResolverOptions<TContext, TMeta, TInputOut>
) => MaybePromise<
  // If an output parser is defined, we need to return what the parser expects, otherwise we return the inferred type
  DefaultValue<TInputOut, $Output>
>;

export interface ProcedureBuilder<TContext, TMeta, TInputIn, TInputOut> {
  /**
   * Add an input parser to the procedure.
   * @link https://trpc.io/docs/v11/server/validators
   */
  input<$Parser extends Parser>(
    schema: TInputOut extends UnsetMarker
      ? $Parser
      : inferParser<$Parser>["out"] extends Record<string, unknown> | undefined
      ? TInputOut extends Record<string, unknown> | undefined
        ? undefined extends inferParser<$Parser>["out"] // if current is optional the previous must be too
          ? undefined extends TInputOut
            ? $Parser
            : TypeError<"Cannot chain an optional parser to a required parser">
          : $Parser
        : TypeError<"All input parsers did not resolve to an object">
      : TypeError<"All input parsers did not resolve to an object">
  ): ProcedureBuilder<
    TContext,
    TMeta,
    IntersectIfDefined<TInputIn, inferParser<$Parser>["in"]>,
    IntersectIfDefined<TInputOut, inferParser<$Parser>["out"]>
  >;
  /**
   * Publisher procedure
   * @link https://trpc.io/docs/v11/concepts#vocabulary
   */
  publisher<$Output>(
    resolver: ProcedureResolver<TContext, TMeta, TInputOut, $Output>
  ): QueryProcedure<{
    input: DefaultValue<TInputIn, void>;
  }>;

  /**
   * Publisher procedure
   * @link https://trpc.io/docs/v11/concepts#vocabulary
   */
  subscriber<$Output>(
    resolver: ProcedureResolver<TContext, TMeta, TInputOut, $Output>
  ): QueryProcedure<{
    input: DefaultValue<TInputIn, void>;
  }>;
}
