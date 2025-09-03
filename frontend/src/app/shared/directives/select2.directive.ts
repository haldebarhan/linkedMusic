// src/app/shared/select2-classic.directive.ts
import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import * as jQuery from 'jquery';
import 'select2/dist/js/select2.full.min.js';

const $ = jQuery as any;
export type Select2Item = { id: string | number; text: string };

@Directive({
  selector: 'select[select2Classic]',
  standalone: true,
})
export class Select2ClassicDirective implements OnInit, OnChanges, OnDestroy {
  @Input() data: Select2Item[] = [];
  @Input() multiple = false;
  @Input() placeholder = 'Select';
  @Input() value: Array<string | number> = [];
  @Input() theme?: string;

  @Output() selectionChange = new EventEmitter<Array<string>>();

  private $el!: any;
  private initialized = false;

  constructor(private el: ElementRef<HTMLSelectElement>) {}

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (!this.initialized) return;
    if (ch['data']) this.rebuildOptions();
    if (ch['value']) this.applyValue();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private init() {
    this.$el = $(this.el.nativeElement);

    // construire les <option> initiaux
    this.rebuildOptions(false);

    const config: any = {
      width: '100%',
      placeholder: this.placeholder,
      multiple: this.multiple,
    };
    if (this.theme) config.theme = this.theme;

    // ✅ sélectionner via le plugin jQuery now disponible
    this.$el.select2(config);

    // events
    this.$el.on('change.select2', () => {
      const val = this.$el.val() || [];
      const arr = Array.isArray(val) ? val : [val].filter(Boolean);
      this.selectionChange.emit(arr.map(String));
    });

    // valeur initiale
    this.applyValue();
    this.initialized = true;
  }

  private rebuildOptions(triggerChange = true) {
    const current = this.$el ? this.$el.val() || [] : [];
    const native = this.el.nativeElement;
    native.innerHTML = '';
    for (const item of this.data) {
      const opt = document.createElement('option');
      opt.value = String(item.id);
      opt.textContent = item.text;
      native.appendChild(opt);
    }
    if (this.initialized && triggerChange) {
      this.$el.val(current).trigger('change.select2');
    }
  }

  private applyValue() {
    if (!this.$el) return;
    const vals = (this.value || []).map(String);
    this.$el.val(vals).trigger('change.select2');
  }

  private destroy() {
    if (this.$el && this.initialized) {
      this.$el.off('.select2');
      this.$el.select2('destroy');
      this.initialized = false;
    }
  }
}
