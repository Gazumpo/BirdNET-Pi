import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarDaily } from './bar-daily';

describe('BarDaily', () => {
  let component: BarDaily;
  let fixture: ComponentFixture<BarDaily>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarDaily]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarDaily);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
