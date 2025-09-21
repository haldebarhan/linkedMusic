import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAnnouncementsDetailsComponent } from './user-announcements-details.component';

describe('UserAnnouncementsDetailsComponent', () => {
  let component: UserAnnouncementsDetailsComponent;
  let fixture: ComponentFixture<UserAnnouncementsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAnnouncementsDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAnnouncementsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
