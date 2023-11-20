import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'valueFromMap',
})
export class ValueFromMapPipe implements PipeTransform {
  transform<T>(key: string, map: Map<string, T>): T | undefined {
    return map.get(key);
  }
}
