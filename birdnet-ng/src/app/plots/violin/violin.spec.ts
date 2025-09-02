import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Violin } from './violin';

describe('Violin', () => {
  let component: Violin;
  let fixture: ComponentFixture<Violin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Violin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Violin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
