import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupHistory } from './pickup-history';

describe('PickupHistory', () => {
  let component: PickupHistory;
  let fixture: ComponentFixture<PickupHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickupHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PickupHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
