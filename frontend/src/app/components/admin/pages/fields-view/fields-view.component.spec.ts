import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldsViewComponent } from './fields-view.component';

describe('FieldsViewComponent', () => {
  let component: FieldsViewComponent;
  let fixture: ComponentFixture<FieldsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldsViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
