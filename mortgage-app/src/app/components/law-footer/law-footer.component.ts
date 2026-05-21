import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { getLawMeta, LawMeta } from '../../constants/law-metadata';

@Component({
  selector: 'app-law-footer',
  standalone: false,
  templateUrl: './law-footer.component.html',
  styleUrl: './law-footer.component.scss',
})
export class LawFooterComponent implements OnInit, OnChanges {
  @Input() route = '/';
  meta: LawMeta = getLawMeta('/');

  ngOnChanges(): void {
    this.meta = getLawMeta(this.route);
  }

  ngOnInit(): void {
    this.meta = getLawMeta(this.route);
  }
}
