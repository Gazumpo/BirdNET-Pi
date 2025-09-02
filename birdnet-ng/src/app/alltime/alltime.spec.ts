import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alltime } from './alltime';

describe('Alltime', () => {
  let component: Alltime;
  let fixture: ComponentFixture<Alltime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alltime]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Alltime);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
