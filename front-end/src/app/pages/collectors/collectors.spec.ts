import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Collectors } from './collectors';

describe('Collectors', () => {
  let component: Collectors;
  let fixture: ComponentFixture<Collectors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collectors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Collectors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
