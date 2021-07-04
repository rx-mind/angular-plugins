export function capitalize<T extends string>(text: T): Capitalize<T> {
  return (text.charAt(0).toUpperCase() + text.substr(1)) as Capitalize<T>;
}

export function removeTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}
