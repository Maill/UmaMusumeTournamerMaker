import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentEditModal } from './tournament-edit-modal';

describe('TournamentEditModal', () => {
  let component: TournamentEditModal;
  let fixture: ComponentFixture<TournamentEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TournamentEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
