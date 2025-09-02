import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spaceToUnderscore'
})
export class SpaceToUnderscorePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return '';
    }
    return value.replace(/\s/g, '-').toLocaleLowerCase(); // Replaces all occurrences of whitespace
  }
}
