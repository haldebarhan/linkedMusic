import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusiciensComponent } from './musiciens.component';

describe('MusiciensComponent', () => {
  let component: MusiciensComponent;
  let fixture: ComponentFixture<MusiciensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusiciensComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MusiciensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
