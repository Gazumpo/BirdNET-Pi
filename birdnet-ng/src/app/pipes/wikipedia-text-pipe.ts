import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'wikipediaText'
})
export class WikipediaTextPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}


  transform(value: string): SafeHtml {
    const formattedValue = value.replace(/\n/g, '</p><p>');
    return this.sanitizer.bypassSecurityTrustHtml(`<p>${formattedValue}</p>`);
  }

}
