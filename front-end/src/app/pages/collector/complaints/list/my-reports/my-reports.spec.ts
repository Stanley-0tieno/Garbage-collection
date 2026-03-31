import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyReports } from './my-reports';

describe('MyReports', () => {
  let component: MyReports;
  let fixture: ComponentFixture<MyReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
