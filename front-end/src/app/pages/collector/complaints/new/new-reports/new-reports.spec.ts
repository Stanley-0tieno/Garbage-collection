import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewReports } from './new-reports';

describe('NewReports', () => {
  let component: NewReports;
  let fixture: ComponentFixture<NewReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
