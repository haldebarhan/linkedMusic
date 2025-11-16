import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerSlidesComponent } from './banner-slides.component';

describe('BannerSlidesComponent', () => {
  let component: BannerSlidesComponent;
  let fixture: ComponentFixture<BannerSlidesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerSlidesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerSlidesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
