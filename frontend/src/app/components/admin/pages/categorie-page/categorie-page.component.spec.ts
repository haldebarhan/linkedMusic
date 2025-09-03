import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriePageComponent } from './categorie-page.component';

describe('CategoriePageComponent', () => {
  let component: CategoriePageComponent;
  let fixture: ComponentFixture<CategoriePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
