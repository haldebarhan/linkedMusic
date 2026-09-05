import { Injectable } from '@angular/core';
@Injectable()
export class PaginationService<T = any> {
  page = 1;
  cursor: string | null = null;
  previousCursors: string[] = [];
  rows: T[] = [];
  appendNextLoad = false;

  pagination = { hasNext: false, nextCursor: null as string | null, limit: 10 };

  private loadDataCallback!: (
    page: number,
    limit: number,
    cursor: string | null,
  ) => void;

  init(loadDataFn: (page: number, limit: number, cursor: string | null) => void) {
    this.loadDataCallback = loadDataFn;
  }

  goToNextPage(append = false): void {
    if (!this.pagination.hasNext || !this.pagination.nextCursor) return;

    this.previousCursors.push(this.cursor ?? '');
    this.cursor = this.pagination.nextCursor;
    this.page++;
    this.appendNextLoad = append;

    if (!append) this.rows = [];
    this.loadDataCallback(this.page, this.pagination.limit, this.cursor);
  }

  goToPreviousPage(): void {
    const previousCursor = this.previousCursors.pop();
    if (previousCursor === undefined) return;

    this.cursor = previousCursor || null;
    this.page = Math.max(1, this.page - 1);
    this.rows = [];
    this.loadDataCallback(this.page, this.pagination.limit, this.cursor);
  }
}
