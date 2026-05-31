import { max, min, SchemaPath, SchemaPathRules } from '@angular/forms/signals';

/** Non-negative currency / count fields. */
export function minZero(path: SchemaPath<number, SchemaPathRules.Supported>): void {
  min(path, 0);
}

/** Percentage 0–100. */
export function pctRange(path: SchemaPath<number, SchemaPathRules.Supported>): void {
  min(path, 0);
  max(path, 100);
}
