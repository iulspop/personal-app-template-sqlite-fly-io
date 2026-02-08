/**
 * Arbitrary factory function for object of shape `Shape`.
 */
export type Factory<Shape> = (object?: Partial<Shape>) => Shape;

/**
 * Discriminated result union for operations that can succeed or fail.
 * Use in application/infra layers. Domain files define their own identical
 * type inline to maintain zero-dependency purity.
 */
export type Result<T, E = string> =
  | { error: E; success: false }
  | { data: T; success: true };
