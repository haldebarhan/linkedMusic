import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnouncementsPostComponent } from './announcements-post.component';

describe('AnnouncementsPostComponent', () => {
  let component: AnnouncementsPostComponent;
  let fixture: ComponentFixture<AnnouncementsPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementsPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnouncementsPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
