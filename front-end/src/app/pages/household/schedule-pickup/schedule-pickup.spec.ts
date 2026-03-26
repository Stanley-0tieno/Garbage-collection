import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulePickup } from './schedule-pickup';

describe('SchedulePickup', () => {
  let component: SchedulePickup;
  let fixture: ComponentFixture<SchedulePickup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePickup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchedulePickup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
