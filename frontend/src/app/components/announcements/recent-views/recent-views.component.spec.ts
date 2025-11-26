import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentViewsComponent } from './recent-views.component';

describe('RecentViewsComponent', () => {
  let component: RecentViewsComponent;
  let fixture: ComponentFixture<RecentViewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentViewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentViewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
