import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarSpecies } from './bar-species';

describe('BarSpecies', () => {
  let component: BarSpecies;
  let fixture: ComponentFixture<BarSpecies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarSpecies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarSpecies);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
