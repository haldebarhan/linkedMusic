import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string,
    limit: number = 50,
    trail: string = '...',
    wordBoundary: boolean = false
  ): string {
    if (!value) {
      return '';
    }

    if (typeof value !== 'string') {
      return value;
    }

    // Si le texte est plus court que la limite, on le retourne tel quel
    if (value.length <= limit) {
      return value;
    }

    // Tronquer le texte
    let truncated = value.substring(0, limit);

    // Si wordBoundary est activé, couper au dernier espace
    if (wordBoundary) {
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        truncated = truncated.substring(0, lastSpaceIndex);
      }
    }

    return truncated + trail;
  }
}
