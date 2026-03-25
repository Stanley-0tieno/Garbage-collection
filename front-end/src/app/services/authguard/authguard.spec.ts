import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Authguard } from './authguard';

describe('Authguard', () => {
  let component: Authguard;
  let fixture: ComponentFixture<Authguard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Authguard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Authguard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
