import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyComplaints } from './my-complaints';

describe('MyComplaints', () => {
  let component: MyComplaints;
  let fixture: ComponentFixture<MyComplaints>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComplaints]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyComplaints);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
