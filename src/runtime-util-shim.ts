export function promisify(fn: (...args: unknown[]) => unknown) {
  return (...args: unknown[]) =>
    new Promise((resolve, reject) => {
      fn(...args, (error: unknown, value: unknown) => {
        if (error) reject(error);
        else resolve(value);
      });
    });
}
