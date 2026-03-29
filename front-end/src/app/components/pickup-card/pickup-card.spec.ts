import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupCard } from './pickup-card';

describe('PickupCard', () => {
  let component: PickupCard;
  let fixture: ComponentFixture<PickupCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickupCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PickupCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
