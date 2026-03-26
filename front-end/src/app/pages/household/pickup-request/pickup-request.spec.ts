import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupRequest } from './pickup-request';

describe('PickupRequest', () => {
  let component: PickupRequest;
  let fixture: ComponentFixture<PickupRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickupRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PickupRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
