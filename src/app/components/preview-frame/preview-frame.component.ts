import { Component, computed, inject, input } from '@angular/core';
import { StudyItem } from '../../models/library.models';
import { HtmlParserService } from '../../services/html-parser.service';

@Component({
  selector: 'app-preview-frame',
  template: `
    <iframe
      class="preview-frame"
      title="Vista del contenido importado"
      sandbox="allow-same-origin"
      [srcdoc]="srcdoc()"
    ></iframe>
  `,
})
export class PreviewFrameComponent {
  private readonly parser = inject(HtmlParserService);

  readonly item = input<StudyItem | null>(null);
  readonly styles = input('');
  readonly query = input('');

  readonly srcdoc = computed(() => this.parser.buildPreviewDocument(this.item(), this.styles(), this.query()));
}
