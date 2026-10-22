
export class OrderError extends Error {
  constructor(
    public code:
      | 'invalid-argument'
      | 'permission-denied'
      | 'unauthenticated'
      | 'failed-precondition'
      | 'not-found'
      | 'already-exists'
      | 'resource-exhausted'
      | 'internal',
    message: string
  ) {
    super(message);
    this.name = 'OrderError';
  }
}
